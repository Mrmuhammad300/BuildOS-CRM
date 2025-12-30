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
    const limit = searchParams.get('limit');
    const status = searchParams.get('status');
    const phase = searchParams.get('phase');
    const search = searchParams.get('search');

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (phase) {
      where.phase = phase;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { client: { contains: search, mode: 'insensitive' } },
        { projectNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        projectManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        superintendent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            rfis: true,
            dailyReports: true,
            documents: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      client,
      projectNumber,
      address,
      city,
      state,
      zipCode,
      startDate,
      estimatedCompletion,
      budget,
      status,
      phase,
      description,
      projectManagerId,
      superintendentId,
      architectId,
      engineerId,
    } = body;

    if (!name || !client || !projectNumber || !address || !startDate || !estimatedCompletion || !budget) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if project number already exists
    const existingProject = await prisma.project.findUnique({
      where: { projectNumber },
    });

    if (existingProject) {
      return NextResponse.json(
        { error: 'Project number already exists' },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name,
        client,
        projectNumber,
        address,
        city,
        state,
        zipCode,
        startDate: new Date(startDate),
        estimatedCompletion: new Date(estimatedCompletion),
        budget: parseFloat(budget),
        status: status || 'PreConstruction',
        phase: phase || 'Planning',
        description,
        projectManagerId: projectManagerId || null,
        superintendentId: superintendentId || null,
        architectId: architectId || null,
        engineerId: engineerId || null,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
