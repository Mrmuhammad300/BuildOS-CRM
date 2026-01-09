import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET /api/materials
 * List material requisitions
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
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (status) {
      where.status = status;
    }

    const materials = await prisma.materialRequisition.findMany({
      where,
      include: {
        project: {
          select: {
            name: true,
            projectNumber: true,
          },
        },
        requestedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        equipment: {
          select: {
            name: true,
            model: true,
          },
        },
      },
      orderBy: { requestedDate: 'desc' },
    });

    return NextResponse.json({ materials });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/materials
 * Create material requisition
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

    const material = await prisma.materialRequisition.create({
      data: {
        projectId: body.projectId,
        requestedById: user.id,
        materialName: body.materialName,
        description: body.description,
        quantity: parseFloat(body.quantity),
        unit: body.unit,
        vendorName: body.vendorName,
        vendorContact: body.vendorContact,
        estimatedCost: body.estimatedCost,
        requestedDate: new Date(body.requestedDate),
        expectedDeliveryDate: body.expectedDeliveryDate ? new Date(body.expectedDeliveryDate) : undefined,
        deliveryLocation: body.deliveryLocation,
        status: body.status || 'Requested',
        equipmentId: body.equipmentId,
        notes: body.notes,
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ material });
  } catch (error) {
    console.error('Error creating material requisition:', error);
    return NextResponse.json(
      { error: 'Failed to create material requisition' },
      { status: 500 }
    );
  }
}
