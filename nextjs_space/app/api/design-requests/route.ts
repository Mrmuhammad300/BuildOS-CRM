import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';

// GET /api/design-requests - List design requests with filters
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const projectId = searchParams.get('projectId');
    const projectType = searchParams.get('projectType');

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build where clause based on filters
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (projectId && projectId !== 'all') {
      where.projectId = projectId;
    }

    if (projectType && projectType !== 'all') {
      where.projectType = projectType;
    }

    // Filter by role
    if (user.role !== 'Admin') {
      // Non-admins can only see their own requests or requests they're assigned to
      where.OR = [
        { submittedById: user.id },
        { assignedToId: user.id },
      ];
    }

    const designRequests = await db.designRequest.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectNumber: true,
          },
        },
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
        tasks: {
          select: {
            id: true,
            taskType: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(designRequests);
  } catch (error: any) {
    console.error('Error fetching design requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch design requests' },
      { status: 500 }
    );
  }
}

// POST /api/design-requests - Create new design request
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await request.json();

    // Generate unique request number
    const count = await db.designRequest.count();
    const requestNumber = `DR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Create design request
    const designRequest = await db.designRequest.create({
      data: {
        requestNumber,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone || null,
        projectName: data.projectName,
        projectType: data.projectType,
        description: data.description,
        requirements: data.requirements,
        siteDetails: data.siteDetails || null,
        budget: data.budget ? parseFloat(data.budget) : null,
        timeline: data.timeline,
        status: 'Draft',
        projectId: data.projectId || null,
        submittedById: user.id,
        assignedToId: data.assignedToId || null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectNumber: true,
          },
        },
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(designRequest, { status: 201 });
  } catch (error: any) {
    console.error('Error creating design request:', error);
    return NextResponse.json(
      { error: 'Failed to create design request' },
      { status: 500 }
    );
  }
}
