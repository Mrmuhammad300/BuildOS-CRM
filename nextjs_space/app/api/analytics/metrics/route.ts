import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET /api/analytics/metrics
 * Get comprehensive analytics metrics
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
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build date filter
    const dateFilter: any = {};
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom);
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo);
    }

    // Get project-level access for non-admin users
    let projectFilter: any = {};
    if (user.role !== 'Admin') {
      const userProjects = await prisma.projectTeam.findMany({
        where: { userId: user.id },
        select: { projectId: true },
      });
      projectFilter = { id: { in: userProjects.map((pt) => pt.projectId) } };
    }

    // ==== PROJECT HEALTH METRICS ====
    
    // Total projects
    const totalProjects = await prisma.project.count({ where: projectFilter });
    
    // Active projects
    const activeProjects = await prisma.project.count({
      where: { ...projectFilter, status: 'Active' },
    });
    
    // Projects by status
    const projectsByStatus = await prisma.project.groupBy({
      by: ['status'],
      where: projectFilter,
      _count: true,
    });
    
    // On-time vs delayed projects
    const projects = await prisma.project.findMany({
      where: projectFilter,
      select: {
        estimatedCompletion: true,
        actualCompletion: true,
        status: true,
      },
    });

    const now = new Date();
    let onTimeCount = 0;
    let delayedCount = 0;

    projects.forEach((project) => {
      if (project.status === 'Completed') {
        if (project.actualCompletion && project.actualCompletion <= project.estimatedCompletion) {
          onTimeCount++;
        } else {
          delayedCount++;
        }
      } else {
        if (now <= project.estimatedCompletion) {
          onTimeCount++;
        } else {
          delayedCount++;
        }
      }
    });

    const onTimePercentage = projects.length > 0 ? (onTimeCount / projects.length) * 100 : 0;
    
    // Budget variance
    const projectsWithBudget = await prisma.project.findMany({
      where: projectFilter,
      include: {
        changeOrders: {
          where: { status: 'Approved' },
        },
      },
    });

    let totalBudget = 0;
    let totalActualCost = 0;

    projectsWithBudget.forEach((project) => {
      totalBudget += project.budget;
      const approvedCOCost = project.changeOrders.reduce(
        (sum, co) => sum + (co.actualCost || co.proposedCost || 0),
        0
      );
      totalActualCost += project.budget + approvedCOCost;
    });

    const budgetVariance = totalBudget > 0 
      ? ((totalActualCost - totalBudget) / totalBudget) * 100 
      : 0;

    // ==== RFI METRICS ====
    
    const rfiWhere: any = {};
    if (Object.keys(projectFilter).length > 0) {
      const projectIds = projectFilter.id?.in || [];
      if (projectIds.length > 0) {
        rfiWhere.projectId = { in: projectIds };
      }
    }
    if (Object.keys(dateFilter).length > 0) {
      rfiWhere.createdAt = dateFilter;
    }
    
    const totalRFIs = await prisma.rFI.count({ where: rfiWhere });
    
    const rfisByStatus = await prisma.rFI.groupBy({
      by: ['status'],
      where: rfiWhere,
      _count: true,
    });
    
    // RFI velocity (average response time)
    const closedRFIs = await prisma.rFI.findMany({
      where: {
        ...rfiWhere,
        status: 'Closed',
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    let totalResponseTime = 0;
    closedRFIs.forEach((rfi) => {
      const responseTime = rfi.updatedAt.getTime() - rfi.createdAt.getTime();
      totalResponseTime += responseTime;
    });

    const avgRFIResponseTime = closedRFIs.length > 0 
      ? totalResponseTime / closedRFIs.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    // ==== SUBMITTAL METRICS ====
    
    const submittalWhere: any = {};
    if (Object.keys(projectFilter).length > 0) {
      const projectIds = projectFilter.id?.in || [];
      if (projectIds.length > 0) {
        submittalWhere.projectId = { in: projectIds };
      }
    }
    if (Object.keys(dateFilter).length > 0) {
      submittalWhere.createdAt = dateFilter;
    }
    
    const totalSubmittals = await prisma.submittal.count({ where: submittalWhere });
    
    const submittalsByStatus = await prisma.submittal.groupBy({
      by: ['status'],
      where: submittalWhere,
      _count: true,
    });
    
    const approvedSubmittals = await prisma.submittal.count({
      where: { ...submittalWhere, status: 'FinalApproval' },
    });
    
    const submittalApprovalRate = totalSubmittals > 0 
      ? (approvedSubmittals / totalSubmittals) * 100 
      : 0;

    // ==== CHANGE ORDER METRICS ====
    
    const changeOrderWhere: any = {};
    if (Object.keys(projectFilter).length > 0) {
      const projectIds = projectFilter.id?.in || [];
      if (projectIds.length > 0) {
        changeOrderWhere.projectId = { in: projectIds };
      }
    }
    if (Object.keys(dateFilter).length > 0) {
      changeOrderWhere.createdAt = dateFilter;
    }
    
    const totalChangeOrders = await prisma.changeOrder.count({ where: changeOrderWhere });
    
    const approvedChangeOrders = await prisma.changeOrder.count({
      where: { ...changeOrderWhere, status: 'Approved' },
    });
    
    const changeOrderApprovalRate = totalChangeOrders > 0 
      ? (approvedChangeOrders / totalChangeOrders) * 100 
      : 0;
    
    const changeOrderCosts = await prisma.changeOrder.aggregate({
      where: { ...changeOrderWhere, status: 'Approved' },
      _sum: {
        proposedCost: true,
        actualCost: true,
      },
    });
    
    const totalCOCost = changeOrderCosts._sum.actualCost || changeOrderCosts._sum.proposedCost || 0;

    // ==== PUNCH ITEM METRICS ====
    
    const punchItemWhere: any = {};
    if (Object.keys(projectFilter).length > 0) {
      const projectIds = projectFilter.id?.in || [];
      if (projectIds.length > 0) {
        punchItemWhere.projectId = { in: projectIds };
      }
    }
    if (Object.keys(dateFilter).length > 0) {
      punchItemWhere.createdAt = dateFilter;
    }
    
    const totalPunchItems = await prisma.punchItem.count({ where: punchItemWhere });
    
    const openPunchItems = await prisma.punchItem.count({
      where: { ...punchItemWhere, status: { notIn: ['Completed', 'Verified'] } },
    });
    
    const completedPunchItems = await prisma.punchItem.count({
      where: { ...punchItemWhere, status: { in: ['Completed', 'Verified'] } },
    });
    
    const punchItemCompletionRate = totalPunchItems > 0 
      ? (completedPunchItems / totalPunchItems) * 100 
      : 0;

    // ==== DOCUMENT METRICS ====
    
    const documentWhere: any = {};
    if (Object.keys(projectFilter).length > 0) {
      const projectIds = projectFilter.id?.in || [];
      if (projectIds.length > 0) {
        documentWhere.projectId = { in: projectIds };
      }
    }
    if (Object.keys(dateFilter).length > 0) {
      documentWhere.uploadedAt = dateFilter;
    }
    
    const totalDocuments = await prisma.document.count({ where: documentWhere });
    
    const documentsByCategory = await prisma.document.groupBy({
      by: ['category'],
      where: documentWhere,
      _count: true,
    });

    // ==== TIME TRACKING METRICS ====
    
    const timeEntryWhere: any = {};
    if (Object.keys(projectFilter).length > 0) {
      const projectIds = projectFilter.id?.in || [];
      if (projectIds.length > 0) {
        timeEntryWhere.projectId = { in: projectIds };
      }
    }
    if (Object.keys(dateFilter).length > 0) {
      timeEntryWhere.date = dateFilter;
    }
    
    const totalTimeEntries = await prisma.timeEntry.count({ where: timeEntryWhere });
    
    const totalHours = await prisma.timeEntry.aggregate({
      where: timeEntryWhere,
      _sum: {
        hoursWorked: true,
        overtimeHours: true,
      },
    });
    
    const totalLaborCost = await prisma.timeEntry.aggregate({
      where: timeEntryWhere,
      _sum: {
        laborCost: true,
        overtimeCost: true,
      },
    });

    // Construct response
    return NextResponse.json({
      projectHealth: {
        totalProjects,
        activeProjects,
        projectsByStatus: projectsByStatus.map((item) => ({
          status: item.status,
          count: item._count,
        })),
        onTimeCount,
        delayedCount,
        onTimePercentage: Math.round(onTimePercentage * 100) / 100,
        budgetVariance: Math.round(budgetVariance * 100) / 100,
        totalBudget,
        totalActualCost,
      },
      rfiMetrics: {
        totalRFIs,
        rfisByStatus: rfisByStatus.map((item) => ({
          status: item.status,
          count: item._count,
        })),
        avgResponseTimeDays: Math.round(avgRFIResponseTime * 100) / 100,
      },
      submittalMetrics: {
        totalSubmittals,
        submittalsByStatus: submittalsByStatus.map((item) => ({
          status: item.status,
          count: item._count,
        })),
        approvedSubmittals,
        approvalRate: Math.round(submittalApprovalRate * 100) / 100,
      },
      changeOrderMetrics: {
        totalChangeOrders,
        approvedChangeOrders,
        approvalRate: Math.round(changeOrderApprovalRate * 100) / 100,
        totalCost: totalCOCost,
      },
      punchItemMetrics: {
        totalPunchItems,
        openPunchItems,
        completedPunchItems,
        completionRate: Math.round(punchItemCompletionRate * 100) / 100,
      },
      documentMetrics: {
        totalDocuments,
        documentsByCategory: documentsByCategory.map((item) => ({
          category: item.category,
          count: item._count,
        })),
      },
      timeTrackingMetrics: {
        totalEntries: totalTimeEntries,
        totalHoursWorked: totalHours._sum.hoursWorked || 0,
        totalOvertimeHours: totalHours._sum.overtimeHours || 0,
        totalLaborCost: (totalLaborCost._sum.laborCost || 0) + (totalLaborCost._sum.overtimeCost || 0),
      },
    });
  } catch (error) {
    console.error('Error fetching analytics metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
