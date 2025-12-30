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

    const submittals = await prisma.submittal.findMany({
      where,
      include: {
        project: { select: { name: true, projectNumber: true } },
        submittedBy: { select: { firstName: true, lastName: true, role: true } },
        assignedTo: { select: { firstName: true, lastName: true, role: true } },
        _count: { select: { responses: true, comments: true } },
      },
      orderBy: { submittedDate: 'desc' },
    });

    return NextResponse.json({ submittals });
  } catch (error) {
    console.error('Error fetching submittals:', error);
    return NextResponse.json({ error: 'Failed to fetch submittals' }, { status: 500 });
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

    const submittalNumber = `SUB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;

    const submittal = await prisma.submittal.create({
      data: {
        submittalNumber,
        title: body.title,
        specSection: body.specSection,
        type: body.type || 'ProductData',
        description: body.description,
        priority: body.priority || 'Normal',
        projectId: body.projectId,
        submittedById: userId,
        assignedToId: body.assignedToId || null,
        requiredOnSiteDate: body.requiredOnSiteDate ? new Date(body.requiredOnSiteDate) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        leadTimeDays: body.leadTimeDays ? parseInt(body.leadTimeDays) : null,
      },
    });

    return NextResponse.json({ submittal }, { status: 201 });
  } catch (error) {
    console.error('Error creating submittal:', error);
    return NextResponse.json({ error: 'Failed to create submittal' }, { status: 500 });
  }
}
