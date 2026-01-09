import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET /api/time-tracking
 * List time entries
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build filter
    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (userId) {
      where.userId = userId;
    } else if (user.role !== 'Admin' && user.role !== 'ProjectManager') {
      // Non-admin/PM users can only see their own time entries
      where.userId = user.id;
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo);
      }
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            name: true,
            projectNumber: true,
          },
        },
        crew: {
          select: {
            name: true,
          },
        },
        approvedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ timeEntries });
  } catch (error) {
    console.error('Error fetching time entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time entries' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/time-tracking
 * Create a new time entry
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId: body.userId || user.id,
        projectId: body.projectId,
        crewId: body.crewId,
        date: new Date(body.date),
        hoursWorked: parseFloat(body.hoursWorked),
        overtimeHours: parseFloat(body.overtimeHours || 0),
        taskDescription: body.taskDescription,
        costCode: body.costCode,
        equipmentUsed: body.equipmentUsed || [],
        status: body.status || 'Draft',
        laborCost: body.laborCost,
        overtimeCost: body.overtimeCost,
        notes: body.notes,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        project: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ timeEntry });
  } catch (error) {
    console.error('Error creating time entry:', error);
    return NextResponse.json(
      { error: 'Failed to create time entry' },
      { status: 500 }
    );
  }
}
