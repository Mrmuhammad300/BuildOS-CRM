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
    const category = searchParams.get('category');
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (category) where.category = category;

    const documents = await prisma.document.findMany({
      where,
      include: {
        project: { select: { name: true, projectNumber: true } },
        uploadedBy: { select: { firstName: true, lastName: true, role: true } },
        versions: { orderBy: { versionNumber: 'desc' }, take: 3 }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const userId = (session.user as any)?.id;

    const document = await prisma.document.create({
      data: {
        projectId: body.projectId,
        filename: body.filename,
        category: body.category,
        discipline: body.discipline,
        cloudStoragePath: body.cloudStoragePath,
        isPublic: body.isPublic || false,
        uploadedById: userId
      }
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}
