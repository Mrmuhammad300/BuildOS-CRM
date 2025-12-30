import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const submittal = await prisma.submittal.findUnique({
      where: { id: params.id },
      include: {
        project: { select: { name: true, projectNumber: true } },
        submittedBy: { select: { firstName: true, lastName: true, role: true } },
        assignedTo: { select: { firstName: true, lastName: true, role: true } },
        responses: {
          include: {
            respondedBy: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        comments: {
          include: {
            author: { select: { firstName: true, lastName: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!submittal) {
      return NextResponse.json({ error: 'Submittal not found' }, { status: 404 });
    }

    return NextResponse.json({ submittal });
  } catch (error) {
    console.error('Error fetching submittal:', error);
    return NextResponse.json({ error: 'Failed to fetch submittal' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.reviewStatus !== undefined) updateData.reviewStatus = body.reviewStatus;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.currentStep !== undefined) updateData.currentStep = body.currentStep;
    if (body.reviewComments !== undefined) updateData.reviewComments = body.reviewComments;
    if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId;

    if (body.reviewStatus === 'Approved' && !updateData.approvedDate) {
      updateData.approvedDate = new Date();
    }

    const submittal = await prisma.submittal.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ submittal });
  } catch (error) {
    console.error('Error updating submittal:', error);
    return NextResponse.json({ error: 'Failed to update submittal' }, { status: 500 });
  }
}
