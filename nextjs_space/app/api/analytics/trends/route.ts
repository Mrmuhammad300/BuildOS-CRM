import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET /api/analytics/trends
 * Get trend data for charts
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
    const days = parseInt(searchParams.get('days') || '30');
    const metric = searchParams.get('metric') || 'all';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get project-level access for non-admin users
    let projectFilter: any = {};
    if (user.role !== 'Admin') {
      const userProjects = await prisma.projectTeam.findMany({
        where: { userId: user.id },
        select: { projectId: true },
      });
      const projectIds = userProjects.map((pt) => pt.projectId);
      projectFilter = { projectId: { in: projectIds } };
    }

    // Fetch all data once and aggregate client-side to avoid too many DB connections
    const [rfis, submittals, changeOrders, punchItems] = await Promise.all([
      prisma.rFI.findMany({
        where: {
          ...projectFilter,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          createdAt: true,
        },
      }),
      prisma.submittal.findMany({
        where: {
          ...projectFilter,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          createdAt: true,
        },
      }),
      prisma.changeOrder.findMany({
        where: {
          ...projectFilter,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          createdAt: true,
        },
      }),
      prisma.punchItem.findMany({
        where: {
          ...projectFilter,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          createdAt: true,
        },
      }),
    ]);

    // Generate date buckets and aggregate counts
    const dateBuckets: string[] = [];
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dateBuckets.push(date.toISOString().split('T')[0]);
    }

    // Helper function to count items for each date
    const aggregateByDate = (items: { createdAt: Date }[]) => {
      const countMap = new Map<string, number>();
      
      items.forEach((item) => {
        const dateKey = new Date(item.createdAt).toISOString().split('T')[0];
        countMap.set(dateKey, (countMap.get(dateKey) || 0) + 1);
      });

      return dateBuckets.map((date) => ({
        date,
        count: countMap.get(date) || 0,
      }));
    };

    const rfiTrend = aggregateByDate(rfis);
    const submittalTrend = aggregateByDate(submittals);
    const changeOrderTrend = aggregateByDate(changeOrders);
    const punchItemTrend = aggregateByDate(punchItems);

    return NextResponse.json({
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days,
      },
      trends: {
        rfis: rfiTrend,
        submittals: submittalTrend,
        changeOrders: changeOrderTrend,
        punchItems: punchItemTrend,
      },
    });
  } catch (error) {
    console.error('Error fetching trend data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trend data' },
      { status: 500 }
    );
  }
}
