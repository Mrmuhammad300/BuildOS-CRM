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
    const trade = searchParams.get('trade');

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (trade) where.trade = trade;

    const punchItems = await prisma.punchItem.findMany({
      where,
      include: {
        project: { select: { name: true, projectNumber: true } },
        identifiedBy: { select: { firstName: true, lastName: true, role: true } },
        assignedTo: { select: { firstName: true, lastName: true, role: true } },
        verifiedBy: { select: { firstName: true, lastName: true, role: true } },
      },
      orderBy: { identifiedDate: 'desc' },
    });

    return NextResponse.json({ punchItems });
  } catch (error) {
    console.error('Error fetching punch items:', error);
    return NextResponse.json({ error: 'Failed to fetch punch items' }, { status: 500 });
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

    // Generate punch item number
    const count = await prisma.punchItem.count() + 1;
    const itemNumber = `PI-${String(count).padStart(5, '0')}`;

    const punchItem = await prisma.punchItem.create({
      data: {
        itemNumber,
        title: body.title,
        description: body.description,
        location: body.location,
        trade: body.trade,
        priority: body.priority || 'Normal',
        estimatedCost: body.estimatedCost ? parseFloat(body.estimatedCost) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        projectId: body.projectId,
        identifiedById: userId,
        assignedToId: body.assignedToId || null,
        attachments: body.attachments || [],
        notes: body.notes,
      },
      include: {
        project: { select: { name: true, projectNumber: true } },
        identifiedBy: { select: { firstName: true, lastName: true, role: true } },
        assignedTo: { select: { firstName: true, lastName: true, role: true } },
      },
    });

    return NextResponse.json({ punchItem }, { status: 201 });
  } catch (error) {
    console.error('Error creating punch item:', error);
    return NextResponse.json({ error: 'Failed to create punch item' }, { status: 500 });
  }
}