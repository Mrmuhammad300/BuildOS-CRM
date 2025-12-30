import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
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

    const response = await prisma.submittalResponse.create({
      data: {
        submittalId: params.id,
        response: body.response,
        reviewStatus: body.reviewStatus,
        isDraft: body.isDraft || false,
        respondedById: userId,
      },
    });

    if (!body.isDraft) {
      await prisma.submittal.update({
        where: { id: params.id },
        data: {
          status: 'FinalApproval',
          reviewStatus: body.reviewStatus,
        },
      });
    }

    return NextResponse.json({ response }, { status: 201 });
  } catch (error) {
    console.error('Error creating response:', error);
    return NextResponse.json({ error: 'Failed to create response' }, { status: 500 });
  }
}
