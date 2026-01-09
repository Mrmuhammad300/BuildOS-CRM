import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { calculateROI, ROIInputs } from '@/lib/roi-calculator';
import { RiskLevel } from '@prisma/client';

/**
 * GET /api/roi-calculator
 * List all ROI calculations for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    
    const whereClause: any = { userId };
    if (projectId) {
      whereClause.projectId = projectId;
    }
    
    const calculations = await prisma.rOICalculation.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });
    
    return NextResponse.json({ calculations });
  } catch (error) {
    console.error('[ROI_CALCULATOR_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch ROI calculations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/roi-calculator
 * Create a new ROI calculation
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;
    const body = await req.json();
    
    const {
      projectId,
      totalProjectCost,
      projectDurationMonths,
      numberOfDrawingRevisions,
      avgRFIChangeOrderVolume,
      avgLaborCostPerHour,
      teamSize,
      reworkPercentage,
      takeoffErrorRate,
      scheduleSlippageWeeks,
      claimsDisputesProbability,
      calculationName,
      notes
    } = body;
    
    // Validate required fields
    if (
      totalProjectCost === undefined ||
      projectDurationMonths === undefined ||
      numberOfDrawingRevisions === undefined ||
      avgRFIChangeOrderVolume === undefined ||
      avgLaborCostPerHour === undefined ||
      teamSize === undefined ||
      reworkPercentage === undefined ||
      takeoffErrorRate === undefined ||
      scheduleSlippageWeeks === undefined ||
      !claimsDisputesProbability
    ) {
      return NextResponse.json(
        { error: 'All input fields are required' },
        { status: 400 }
      );
    }
    
    // Validate risk level
    const validRiskLevels = ['Low', 'Medium', 'High'];
    if (!validRiskLevels.includes(claimsDisputesProbability)) {
      return NextResponse.json(
        { error: 'Invalid risk level' },
        { status: 400 }
      );
    }
    
    // Calculate ROI
    const inputs: ROIInputs = {
      totalProjectCost: parseFloat(totalProjectCost),
      projectDurationMonths: parseInt(projectDurationMonths),
      numberOfDrawingRevisions: parseInt(numberOfDrawingRevisions),
      avgRFIChangeOrderVolume: parseFloat(avgRFIChangeOrderVolume),
      avgLaborCostPerHour: parseFloat(avgLaborCostPerHour),
      teamSize: parseInt(teamSize),
      reworkPercentage: parseFloat(reworkPercentage),
      takeoffErrorRate: parseFloat(takeoffErrorRate),
      scheduleSlippageWeeks: parseInt(scheduleSlippageWeeks),
      claimsDisputesProbability: claimsDisputesProbability as 'Low' | 'Medium' | 'High'
    };
    
    const roiBreakdown = calculateROI(inputs);
    
    // Save to database
    const calculation = await prisma.rOICalculation.create({
      data: {
        userId,
        projectId: projectId || null,
        totalProjectCost: inputs.totalProjectCost,
        projectDurationMonths: inputs.projectDurationMonths,
        numberOfDrawingRevisions: inputs.numberOfDrawingRevisions,
        avgRFIChangeOrderVolume: inputs.avgRFIChangeOrderVolume,
        avgLaborCostPerHour: inputs.avgLaborCostPerHour,
        teamSize: inputs.teamSize,
        reworkPercentage: inputs.reworkPercentage,
        takeoffErrorRate: inputs.takeoffErrorRate,
        scheduleSlippageWeeks: inputs.scheduleSlippageWeeks,
        claimsDisputesProbability: claimsDisputesProbability as RiskLevel,
        reworkCostSavings: roiBreakdown.reworkCostSavings,
        takeoffEfficiencySavings: roiBreakdown.takeoffEfficiencySavings,
        scheduleCompressionSavings: roiBreakdown.scheduleCompressionSavings,
        claimsRiskAvoidanceSavings: roiBreakdown.claimsRiskAvoidanceSavings,
        totalSavings: roiBreakdown.totalSavings,
        roiPercentage: roiBreakdown.roiPercentage,
        calculationName: calculationName || null,
        notes: notes || null
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });
    
    return NextResponse.json(
      { 
        calculation,
        breakdown: roiBreakdown
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[ROI_CALCULATOR_POST]', error);
    return NextResponse.json(
      { error: 'Failed to create ROI calculation' },
      { status: 500 }
    );
  }
}
