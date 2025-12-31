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

    const changeOrder = await prisma.changeOrder.findUnique({
      where: { id: params.id },
      include: {
        project: { select: { name: true, projectNumber: true, budget: true } },
        requestedBy: { select: { firstName: true, lastName: true, role: true } },
        approvedBy: { select: { firstName: true, lastName: true, role: true } },
      },
    });

    if (!changeOrder) {
      return NextResponse.json({ error: 'Change order not found' }, { status: 404 });
    }

    return NextResponse.json({ changeOrder });
  } catch (error) {
    console.error('Error fetching change order:', error);
    return NextResponse.json({ error: 'Failed to fetch change order' }, { status: 500 });
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
    if (body.approvedCost !== undefined) updateData.approvedCost = parseFloat(body.approvedCost);
    if (body.actualCost !== undefined) updateData.actualCost = parseFloat(body.actualCost);
    if (body.priority !== undefined) updateData.priority = body.priority;

    // Set approval date and approver when status changes to Approved
    if (body.status === 'Approved') {
      updateData.approvedDate = new Date();
      updateData.approvedById = userId;
      if (!updateData.approvedCost && body.proposedCost) {
        updateData.approvedCost = parseFloat(body.proposedCost);
      }
    }

    // Set completion date when implemented
    if (body.status === 'Implemented' && !updateData.completedDate) {
      updateData.completedDate = new Date();
    }

    const changeOrder = await prisma.changeOrder.update({
      where: { id: params.id },
      data: updateData,
      include: {
        project: { select: { name: true, projectNumber: true } },
        requestedBy: { select: { firstName: true, lastName: true, role: true } },
        approvedBy: { select: { firstName: true, lastName: true, role: true } },
      },
    });

    return NextResponse.json({ changeOrder });
  } catch (error) {
    console.error('Error updating change order:', error);
    return NextResponse.json({ error: 'Failed to update change order' }, { status: 500 });
  }
}