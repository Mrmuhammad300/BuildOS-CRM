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

    // Get total projects
    const totalProjects = await prisma.project.count();

    // Get active projects
    const activeProjects = await prisma.project.count({
      where: { status: 'Active' },
    });

    // Get open RFIs
    const openRFIs = await prisma.rFI.count({
      where: {
        status: {
          in: ['Open', 'InReview', 'DraftResponse'],
        },
      },
    });

    // Get critical RFIs
    const criticalRFIs = await prisma.rFI.count({
      where: {
        priority: 'Critical',
        status: {
          in: ['Open', 'InReview', 'DraftResponse'],
        },
      },
    });

    // Get recent reports (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentReports = await prisma.dailyReport.count({
      where: {
        date: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Get total budget
    const projects = await prisma.project.findMany({
      select: { budget: true },
    });
    const totalBudget = projects?.reduce((sum: number, p: any) => sum + (p?.budget ?? 0), 0) ?? 0;

    return NextResponse.json({
      totalProjects,
      activeProjects,
      openRFIs,
      criticalRFIs,
      recentReports,
      totalBudget,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
