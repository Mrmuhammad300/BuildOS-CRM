import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project');
    const status = searchParams.get('status');

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const changeOrders = await prisma.changeOrder.findMany({
      where,
      include: {
        project: { select: { name: true, projectNumber: true } },
        requestedBy: { select: { firstName: true, lastName: true, role: true } },
        approvedBy: { select: { firstName: true, lastName: true, role: true } },
      },
      orderBy: { requestedDate: 'desc' },
    });

    return NextResponse.json({ changeOrders });
  } catch (error) {
    console.error('Error fetching change orders:', error);
    return NextResponse.json({ error: 'Failed to fetch change orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const userId = (session.user as any).id;

    // Generate change order number
    const year = new Date().getFullYear();
    const count = await prisma.changeOrder.count() + 1;
    const changeOrderNumber = `CO-${year}-${String(count).padStart(4, '0')}`;

    const changeOrder = await prisma.changeOrder.create({
      data: {
        changeOrderNumber,
        title: body.title,
        description: body.description,
        type: body.type || 'Scope',
        priority: body.priority || 'Normal',
        proposedCost: parseFloat(body.proposedCost),
        scheduleImpact: body.scheduleImpact ? parseInt(body.scheduleImpact) : null,
        reason: body.reason,
        justification: body.justification,
        projectId: body.projectId,
        requestedById: userId,
        attachments: body.attachments || [],
      },
      include: {
        project: { select: { name: true, projectNumber: true } },
        requestedBy: { select: { firstName: true, lastName: true, role: true } },
      },
    });

    return NextResponse.json({ changeOrder }, { status: 201 });
  } catch (error) {
    console.error('Error creating change order:', error);
    return NextResponse.json({ error: 'Failed to create change order' }, { status: 500 });
  }
}