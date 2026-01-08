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
    const assetType = searchParams.get('assetType');
    const developmentStage = searchParams.get('developmentStage');
    const statusIndicator = searchParams.get('statusIndicator');
    const projectId = searchParams.get('projectId');

    const where: any = {};
    if (assetType) where.assetType = assetType;
    if (developmentStage) where.developmentStage = developmentStage;
    if (statusIndicator) where.statusIndicator = statusIndicator;
    if (projectId) where.projectId = projectId;

    const properties = await prisma.property.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectNumber: true,
            status: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ properties });
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
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
    const userId = (session.user as any).id;

    // Validate required fields
    if (!body.name || !body.purchasePrice) {
      return NextResponse.json(
        { error: 'Name and purchase price are required' },
        { status: 400 }
      );
    }

    // Calculate total project cost
    const totalProjectCost =
      parseFloat(body.purchasePrice) +
      (parseFloat(body.hardCosts) || 0) +
      (parseFloat(body.softCosts) || 0) +
      (parseFloat(body.financingCosts) || 0) +
      (parseFloat(body.contingency) || 0);

    const property = await prisma.property.create({
      data: {
        // Property Profile
        name: body.name,
        street: body.street || '',
        city: body.city || '',
        state: body.state || '',
        zip: body.zip || '',
        assetType: body.assetType || 'Residential',
        developmentStage: body.developmentStage || 'PreDevelopment',
        units: body.units ? parseInt(body.units) : null,
        squareFeet: body.squareFeet ? parseInt(body.squareFeet) : null,
        acquisitionDate: body.acquisitionDate
          ? new Date(body.acquisitionDate)
          : null,
        holdPeriodYears: body.holdPeriodYears
          ? parseInt(body.holdPeriodYears)
          : null,

        // Executive Summary
        purchasePrice: parseFloat(body.purchasePrice),
        totalProjectCost,
        equityInvested: parseFloat(body.equityInvested) || 0,
        debtAmount: parseFloat(body.debtAmount) || 0,
        targetIRR: body.targetIRR ? parseFloat(body.targetIRR) : null,
        targetCashOnCash: body.targetCashOnCash
          ? parseFloat(body.targetCashOnCash)
          : null,
        statusIndicator: body.statusIndicator || 'Green',

        // Capital Stack
        hardCosts: parseFloat(body.hardCosts) || 0,
        softCosts: parseFloat(body.softCosts) || 0,
        financingCosts: parseFloat(body.financingCosts) || 0,
        contingency: parseFloat(body.contingency) || 0,

        // Debt Details
        debtInterestRate: body.debtInterestRate
          ? parseFloat(body.debtInterestRate)
          : null,
        debtTermYears: body.debtTermYears ? parseInt(body.debtTermYears) : null,
        debtAmortizationYears: body.debtAmortizationYears
          ? parseInt(body.debtAmortizationYears)
          : null,

        // Operating Assumptions
        avgMonthlyRentPerUnit: parseFloat(body.avgMonthlyRentPerUnit) || 0,
        otherIncomeMonthly: parseFloat(body.otherIncomeMonthly) || 0,
        vacancyRate: parseFloat(body.vacancyRate) || 0.05,
        expenseRatio: parseFloat(body.expenseRatio) || 0.4,
        annualRentGrowthRate: parseFloat(body.annualRentGrowthRate) || 0.03,
        annualExpenseGrowthRate:
          parseFloat(body.annualExpenseGrowthRate) || 0.03,

        // Exit Assumptions
        exitCapRate: parseFloat(body.exitCapRate) || 0.06,
        saleCostPercentage: parseFloat(body.saleCostPercentage) || 0.05,

        // Relationships
        projectId: body.projectId || null,
        ownerId: userId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectNumber: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ property }, { status: 201 });
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    );
  }
}
