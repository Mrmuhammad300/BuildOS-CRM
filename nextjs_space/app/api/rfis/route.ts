import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const rfis = await prisma.rFI.findMany({
      where,
      include: {
        project: { select: { name: true, projectNumber: true } },
        submittedBy: { select: { firstName: true, lastName: true, role: true } },
        assignedTo: { select: { firstName: true, lastName: true, role: true } },
        responses: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { comments: true, responses: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ rfis });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch RFIs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const userId = (session.user as any)?.id;

    const year = new Date().getFullYear();
    const count = await prisma.rFI.count({ where: { rfiNumber: { startsWith: `RFI-${year}` } } });
    const rfiNumber = `RFI-${year}-${String(count + 1).padStart(4, '0')}`;

    const rfi = await prisma.rFI.create({
      data: {
        rfiNumber,
        projectId: body.projectId,
        subject: body.subject,
        question: body.question,
        drawingReference: body.drawingReference,
        specSection: body.specSection,
        priority: body.priority || 'Normal',
        status: 'Open',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        costImpact: body.costImpact || false,
        scheduleImpact: body.scheduleImpact || false,
        estimatedDelayDays: body.estimatedDelayDays || null,
        submittedById: userId,
        assignedToId: body.assignedToId || null,
        attachments: body.attachments || [],
        distributionList: body.distributionList || []
      }
    });

    return NextResponse.json({ rfi }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to create RFI' }, { status: 500 });
  }
}
