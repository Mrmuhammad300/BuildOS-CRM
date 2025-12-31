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

    const punchItem = await prisma.punchItem.findUnique({
      where: { id: params.id },
      include: {
        project: { select: { name: true, projectNumber: true } },
        identifiedBy: { select: { firstName: true, lastName: true, role: true } },
        assignedTo: { select: { firstName: true, lastName: true, role: true } },
        verifiedBy: { select: { firstName: true, lastName: true, role: true } },
      },
    });

    if (!punchItem) {
      return NextResponse.json({ error: 'Punch item not found' }, { status: 404 });
    }

    return NextResponse.json({ punchItem });
  } catch (error) {
    console.error('Error fetching punch item:', error);
    return NextResponse.json({ error: 'Failed to fetch punch item' }, { status: 500 });
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
    const userId = (session.user as any).id;
    const updateData: any = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId;
    if (body.actualCost !== undefined) updateData.actualCost = parseFloat(body.actualCost);
    if (body.notes !== undefined) updateData.notes = body.notes;

    // Set completion date when completed
    if (body.status === 'Completed' && !updateData.completedDate) {
      updateData.completedDate = new Date();
    }

    // Set verified date and verifier when verified
    if (body.status === 'Verified') {
      updateData.verifiedDate = new Date();
      updateData.verifiedById = userId;
    }

    const punchItem = await prisma.punchItem.update({
      where: { id: params.id },
      data: updateData,
      include: {
        project: { select: { name: true, projectNumber: true } },
        identifiedBy: { select: { firstName: true, lastName: true, role: true } },
        assignedTo: { select: { firstName: true, lastName: true, role: true } },
        verifiedBy: { select: { firstName: true, lastName: true, role: true } },
      },
    });

    return NextResponse.json({ punchItem });
  } catch (error) {
    console.error('Error updating punch item:', error);
    return NextResponse.json({ error: 'Failed to update punch item' }, { status: 500 });
  }
}