import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  verifyWebhookCallback,
  parseWebhookCallback,
  mapExternalStatus,
} from '@/lib/design-webhook';

/**
 * POST /api/webhooks/design-callback
 * 
 * Receives updates from the external AI design platform
 * 
 * Expected payload:
 * {
 *   "callbackSecret": "<secret>",
 *   "externalTaskId": "<external_id>",
 *   "taskId": "<our_task_id>",
 *   "requestId": "<our_request_id>",
 *   "status": "queued|processing|completed|failed",
 *   "progress": 0-100,
 *   "resultUrl": "<url_to_result>",
 *   "resultFiles": ["url1", "url2"],
 *   "resultData": { ... },
 *   "errorMessage": "<error_if_failed>",
 *   "startedAt": "<iso_timestamp>",
 *   "completedAt": "<iso_timestamp>"
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log('[Design Callback] Received webhook:', {
      externalTaskId: body.externalTaskId || body.taskId,
      status: body.status,
      requestId: body.requestId,
    });

    // Verify webhook secret
    const secret = body.callbackSecret || body.webhookSecret || body.secret;
    if (!verifyWebhookCallback(body, secret)) {
      console.error('[Design Callback] Invalid webhook secret');
      return NextResponse.json(
        { error: 'Invalid webhook secret' },
        { status: 401 }
      );
    }

    // Parse callback payload
    const callback = parseWebhookCallback(body);
    if (!callback) {
      console.error('[Design Callback] Invalid callback payload');
      return NextResponse.json(
        { error: 'Invalid callback payload' },
        { status: 400 }
      );
    }

    // Find the task by external ID or internal ID
    let task = null;
    if (callback.taskId) {
      task = await db.designTask.findUnique({
        where: { id: callback.taskId },
        include: {
          designRequest: true,
        },
      });
    } else if (callback.externalTaskId) {
      task = await db.designTask.findFirst({
        where: { externalTaskId: callback.externalTaskId },
        include: {
          designRequest: true,
        },
      });
    }

    if (!task) {
      console.error('[Design Callback] Task not found:', {
        taskId: callback.taskId,
        externalTaskId: callback.externalTaskId,
      });
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Map external status to internal status
    const internalStatus = mapExternalStatus(callback.status);

    // Update task
    const updateData: any = {
      externalStatus: callback.status,
      status: internalStatus,
      lastSyncAt: new Date(),
    };

    if (callback.resultUrl) {
      updateData.resultUrl = callback.resultUrl;
    }

    if (callback.resultFiles && callback.resultFiles.length > 0) {
      updateData.resultFiles = callback.resultFiles;
    }

    if (callback.resultData) {
      updateData.resultData = JSON.stringify(callback.resultData);
    }

    if (callback.errorMessage) {
      updateData.errorMessage = callback.errorMessage;
    }

    if (callback.startedAt && !task.startedAt) {
      updateData.startedAt = new Date(callback.startedAt);
    }

    if (callback.completedAt && internalStatus === 'Completed') {
      updateData.completedAt = new Date(callback.completedAt);
    }

    // Store the full callback in externalResponse
    updateData.externalResponse = JSON.stringify(callback);

    await db.designTask.update({
      where: { id: task.id },
      data: updateData,
    });

    // Update design request status if needed
    if (task.designRequest) {
      const allTasks = await db.designTask.findMany({
        where: { designRequestId: task.designRequestId },
      });

      const allCompleted = allTasks.every((t: any) => t.status === 'Completed');
      const anyFailed = allTasks.some((t: any) => t.status === 'Failed');
      const anyProcessing = allTasks.some((t: any) => t.status === 'Processing' || t.status === 'Queued');

      let requestStatus = task.designRequest.status;

      if (allCompleted) {
        requestStatus = 'Completed';
      } else if (anyFailed && !anyProcessing) {
        // Only mark as failed if no tasks are still processing
        requestStatus = 'UnderReview';
      } else if (anyProcessing) {
        requestStatus = 'Rendering';
      }

      if (requestStatus !== task.designRequest.status) {
        await db.designRequest.update({
          where: { id: task.designRequestId },
          data: {
            status: requestStatus,
            completedAt: allCompleted ? new Date() : null,
          },
        });
      }
    }

    console.log('[Design Callback] Task updated successfully:', {
      taskId: task.id,
      status: internalStatus,
      externalStatus: callback.status,
    });

    return NextResponse.json({
      success: true,
      taskId: task.id,
      status: internalStatus,
    });
  } catch (error: any) {
    console.error('[Design Callback] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// GET method to verify endpoint is working
export async function GET() {
  return NextResponse.json({
    endpoint: 'design-callback',
    status: 'active',
    message: 'Webhook endpoint for receiving design task updates from external AI platform',
  });
}
