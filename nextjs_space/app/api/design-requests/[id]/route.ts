import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';

// GET /api/design-requests/[id] - Get single design request
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const designRequest = await db.designRequest.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectNumber: true,
            address: true,
            city: true,
            state: true,
          },
        },
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        tasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!designRequest) {
      return NextResponse.json(
        { error: 'Design request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(designRequest);
  } catch (error: any) {
    console.error('Error fetching design request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch design request' },
      { status: 500 }
    );
  }
}

// PATCH /api/design-requests/[id] - Update design request
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Build update data object
    const updateData: any = {};

    // Only update fields that are provided
    if (data.clientName !== undefined) updateData.clientName = data.clientName;
    if (data.clientEmail !== undefined) updateData.clientEmail = data.clientEmail;
    if (data.clientPhone !== undefined) updateData.clientPhone = data.clientPhone;
    if (data.projectName !== undefined) updateData.projectName = data.projectName;
    if (data.projectType !== undefined) updateData.projectType = data.projectType;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.requirements !== undefined) updateData.requirements = data.requirements;
    if (data.siteDetails !== undefined) updateData.siteDetails = data.siteDetails;
    if (data.budget !== undefined) updateData.budget = data.budget ? parseFloat(data.budget) : null;
    if (data.timeline !== undefined) updateData.timeline = data.timeline;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.projectId !== undefined) updateData.projectId = data.projectId === 'none' ? null : data.projectId;
    if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId === 'none' ? null : data.assignedToId;
    if (data.revisionNotes !== undefined) updateData.revisionNotes = data.revisionNotes;
    
    // AI Analysis fields
    if (data.aiAnalysisCompleted !== undefined) updateData.aiAnalysisCompleted = data.aiAnalysisCompleted;
    if (data.designConcept !== undefined) updateData.designConcept = data.designConcept;
    if (data.styleRecommendations !== undefined) updateData.styleRecommendations = data.styleRecommendations;
    if (data.spatialLayout !== undefined) updateData.spatialLayout = data.spatialLayout;
    if (data.materialSuggestions !== undefined) updateData.materialSuggestions = data.materialSuggestions;
    if (data.sustainabilityFeatures !== undefined) updateData.sustainabilityFeatures = data.sustainabilityFeatures;
    if (data.budgetConsiderations !== undefined) updateData.budgetConsiderations = data.budgetConsiderations;
    if (data.timelineEstimate !== undefined) updateData.timelineEstimate = data.timelineEstimate;
    if (data.visualizationPrompt !== undefined) updateData.visualizationPrompt = data.visualizationPrompt;
    if (data.visualizationUrl !== undefined) updateData.visualizationUrl = data.visualizationUrl;
    
    // External platform fields
    if (data.externalRequestId !== undefined) updateData.externalRequestId = data.externalRequestId;
    if (data.externalStatus !== undefined) updateData.externalStatus = data.externalStatus;

    // Update timestamps based on status changes
    if (data.status === 'Submitted' && !updateData.submittedAt) {
      updateData.submittedAt = new Date();
    }
    if (data.status === 'Approved' && !updateData.approvedAt) {
      updateData.approvedAt = new Date();
    }
    if (data.status === 'Completed' && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }
    if (data.status === 'RevisionRequired') {
      updateData.revisionCount = { increment: 1 };
    }

    const designRequest = await db.designRequest.update({
      where: { id: params.id },
      data: updateData,
      include: {
        project: true,
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        tasks: true,
      },
    });

    return NextResponse.json(designRequest);
  } catch (error: any) {
    console.error('Error updating design request:', error);
    return NextResponse.json(
      { error: 'Failed to update design request' },
      { status: 500 }
    );
  }
}

// DELETE /api/design-requests/[id] - Delete design request
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Only admins can delete design requests' },
        { status: 403 }
      );
    }

    await db.designRequest.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting design request:', error);
    return NextResponse.json(
      { error: 'Failed to delete design request' },
      { status: 500 }
    );
  }
}
