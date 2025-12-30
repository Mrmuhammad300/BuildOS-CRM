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
    const where: any = {};
    if (projectId) where.projectId = projectId;

    const reports = await prisma.dailyReport.findMany({
      where,
      include: {
        project: { select: { name: true, projectNumber: true } },
        submittedBy: { select: { firstName: true, lastName: true, role: true } }
      },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const userId = (session.user as any)?.id;

    const report = await prisma.dailyReport.create({
      data: {
        projectId: body.projectId,
        date: new Date(body.date),
        submittedById: userId,
        weatherCondition: body.weatherCondition,
        temperatureHigh: body.temperatureHigh ? parseFloat(body.temperatureHigh) : null,
        temperatureLow: body.temperatureLow ? parseFloat(body.temperatureLow) : null,
        precipitation: body.precipitation ? parseFloat(body.precipitation) : null,
        windSpeed: body.windSpeed ? parseFloat(body.windSpeed) : null,
        contractorWorkers: body.contractorWorkers ? parseInt(body.contractorWorkers) : 0,
        subcontractorWorkers: body.subcontractorWorkers ? parseInt(body.subcontractorWorkers) : 0,
        tradesOnSite: body.tradesOnSite || [],
        workPerformed: body.workPerformed,
        equipmentOnSite: body.equipmentOnSite || [],
        materialsDelivered: body.materialsDelivered || [],
        incidentsCount: body.incidentsCount ? parseInt(body.incidentsCount) : 0,
        nearMissesCount: body.nearMissesCount ? parseInt(body.nearMissesCount) : 0,
        safetyViolations: body.safetyViolations || [],
        ppeComplianceStatus: body.ppeComplianceStatus,
        issuesAndDelays: body.issuesAndDelays,
        photos: body.photos || [],
        inspectionsConducted: body.inspectionsConducted || []
      }
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}
