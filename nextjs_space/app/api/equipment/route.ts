import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET /api/equipment
 * List equipment
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const projectId = searchParams.get('projectId');

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (projectId) {
      where.currentProjectId = projectId;
    }

    const equipment = await prisma.equipment.findMany({
      where,
      include: {
        currentProject: {
          select: {
            name: true,
            projectNumber: true,
          },
        },
        maintenanceHistory: {
          orderBy: { maintenanceDate: 'desc' },
          take: 3,
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ equipment });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch equipment' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/equipment
 * Create new equipment
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

    if (!user || (user.role !== 'Admin' && user.role !== 'ProjectManager')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const equipment = await prisma.equipment.create({
      data: {
        name: body.name,
        model: body.model,
        serialNumber: body.serialNumber,
        description: body.description,
        ownershipType: body.ownershipType || 'Owned',
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
        purchasePrice: body.purchasePrice,
        rentalDailyRate: body.rentalDailyRate,
        status: body.status || 'Available',
        currentProjectId: body.currentProjectId,
        maintenanceIntervalDays: body.maintenanceIntervalDays,
      },
    });

    return NextResponse.json({ equipment });
  } catch (error) {
    console.error('Error creating equipment:', error);
    return NextResponse.json(
      { error: 'Failed to create equipment' },
      { status: 500 }
    );
  }
}
