import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rfi = await prisma.rFI.findUnique({
      where: { id: params.id },
      include: {
        project: true,
        submittedBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        responses: {
          include: { respondedBy: { select: { firstName: true, lastName: true, role: true } } },
          orderBy: { createdAt: 'desc' }
        },
        comments: {
          include: { author: { select: { firstName: true, lastName: true, role: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!rfi) return NextResponse.json({ error: 'RFI not found' }, { status: 404 });
    return NextResponse.json({ rfi });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch RFI' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const updateData: any = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId;
    if (body.status === 'Closed') updateData.closedAt = new Date();

    const rfi = await prisma.rFI.update({ where: { id: params.id }, data: updateData });
    return NextResponse.json({ rfi });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to update RFI' }, { status: 500 });
  }
}
