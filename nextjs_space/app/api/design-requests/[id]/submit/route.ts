import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';
import {
  sendDesignTaskToExternalPlatform,
  generateCallbackUrl,
  getCallbackSecret,
  type DesignTaskPayload,
} from '@/lib/design-webhook';

// POST /api/design-requests/[id]/submit - Submit design request and create tasks
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { taskTypes } = data; // Array of task types to create

    // Get design request
    const designRequest = await db.designRequest.findUnique({
      where: { id: params.id },
    });

    if (!designRequest) {
      return NextResponse.json(
        { error: 'Design request not found' },
        { status: 404 }
      );
    }

    // Update request status to Submitted
    await db.designRequest.update({
      where: { id: params.id },
      data: {
        status: 'Submitted',
        submittedAt: new Date(),
      },
    });

    // Create tasks for each selected task type
    const taskResults: any[] = [];
    const errors: any[] = [];

    for (const taskTypeData of taskTypes) {
      try {
        const taskType = taskTypeData.type || taskTypeData;
        const taskTitle = taskTypeData.title || `${taskType} Task`;
        const taskDescription = taskTypeData.description || `${taskType} for ${designRequest.projectName}`;

        // Create task in database
        const task = await db.designTask.create({
          data: {
            designRequestId: designRequest.id,
            taskType,
            title: taskTitle,
            description: taskDescription,
            priority: taskTypeData.priority || 'Normal',
            status: 'Pending',
          },
        });

        // Prepare payload for external platform
        const payload: DesignTaskPayload = {
          action: 'create_design_task',
          requestId: designRequest.id,
          requestNumber: designRequest.requestNumber,
          taskId: task.id,
          taskType,
          title: taskTitle,
          description: taskDescription,
          priority: taskTypeData.priority || 'Normal',
          projectName: designRequest.projectName,
          projectType: designRequest.projectType,
          requirements: designRequest.requirements,
          siteDetails: designRequest.siteDetails || '',
          budget: designRequest.budget || undefined,
          timeline: designRequest.timeline,
          clientName: designRequest.clientName,
          clientEmail: designRequest.clientEmail,
          clientPhone: designRequest.clientPhone || undefined,
          designConcept: designRequest.designConcept || undefined,
          styleRecommendations: designRequest.styleRecommendations || undefined,
          spatialLayout: designRequest.spatialLayout || undefined,
          materialSuggestions: designRequest.materialSuggestions || undefined,
          sustainabilityFeatures: designRequest.sustainabilityFeatures || undefined,
          visualizationPrompt: designRequest.visualizationPrompt || undefined,
          callbackUrl: generateCallbackUrl(designRequest.id, task.id),
          callbackSecret: getCallbackSecret(),
        };

        // Send to external platform
        const response = await sendDesignTaskToExternalPlatform(payload);

        if (response.success) {
          // Update task with external platform response
          await db.designTask.update({
            where: { id: task.id },
            data: {
              sentToExternalPlatform: true,
              externalTaskId: response.externalTaskId,
              externalStatus: response.status,
              status: 'Queued',
              webhookPayload: JSON.stringify(payload),
              webhookResponse: JSON.stringify(response),
              lastSyncAt: new Date(),
            },
          });

          taskResults.push({
            taskId: task.id,
            taskType,
            status: 'success',
            externalTaskId: response.externalTaskId,
            message: response.message,
          });
        } else {
          // Update task with error
          await db.designTask.update({
            where: { id: task.id },
            data: {
              status: 'Failed',
              errorMessage: response.error,
              webhookPayload: JSON.stringify(payload),
              webhookResponse: JSON.stringify(response),
            },
          });

          errors.push({
            taskId: task.id,
            taskType,
            error: response.error,
          });
        }
      } catch (error: any) {
        console.error(`Error creating task for ${taskTypeData.type}:`, error);
        errors.push({
          taskType: taskTypeData.type || taskTypeData,
          error: error.message,
        });
      }
    }

    // Update design request status based on results
    if (errors.length === 0) {
      await db.designRequest.update({
        where: { id: params.id },
        data: {
          status: 'AIProcessing',
        },
      });
    } else if (taskResults.length === 0) {
      // All tasks failed
      await db.designRequest.update({
        where: { id: params.id },
        data: {
          status: 'Draft',
          submittedAt: null,
        },
      });
    }

    return NextResponse.json({
      success: errors.length < taskTypes.length,
      tasksCreated: taskResults.length,
      tasksFailed: errors.length,
      results: taskResults,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error submitting design request:', error);
    return NextResponse.json(
      { error: 'Failed to submit design request' },
      { status: 500 }
    );
  }
}
