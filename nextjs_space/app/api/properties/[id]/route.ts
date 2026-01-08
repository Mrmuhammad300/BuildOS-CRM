import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { calculateFinancials } from '@/lib/financial-calculations';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const property = await prisma.property.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectNumber: true,
            status: true,
            phase: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Calculate financials
    let financials = null;
    try {
      if (
        property.units &&
        property.equityInvested > 0 &&
        property.holdPeriodYears
      ) {
        financials = calculateFinancials({
          purchasePrice: property.purchasePrice,
          hardCosts: property.hardCosts,
          softCosts: property.softCosts,
          financingCosts: property.financingCosts,
          contingency: property.contingency,
          equityInvested: property.equityInvested,
          debtAmount: property.debtAmount,
          debtInterestRate: property.debtInterestRate || 0.05,
          debtTermYears: property.debtTermYears || 30,
          debtAmortizationYears: property.debtAmortizationYears || 30,
          units: property.units,
          avgMonthlyRentPerUnit: property.avgMonthlyRentPerUnit,
          otherIncomeMonthly: property.otherIncomeMonthly,
          vacancyRate: property.vacancyRate,
          expenseRatio: property.expenseRatio,
          annualRentGrowthRate: property.annualRentGrowthRate,
          annualExpenseGrowthRate: property.annualExpenseGrowthRate,
          exitCapRate: property.exitCapRate,
          saleCostPercentage: property.saleCostPercentage,
          holdPeriodYears: property.holdPeriodYears,
        });
      }
    } catch (error) {
      console.error('Error calculating financials:', error);
    }

    return NextResponse.json({ property, financials });
  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id: params.id },
    });

    if (!existingProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};

    // Property Profile
    if (body.name !== undefined) updateData.name = body.name;
    if (body.street !== undefined) updateData.street = body.street;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.zip !== undefined) updateData.zip = body.zip;
    if (body.assetType !== undefined) updateData.assetType = body.assetType;
    if (body.developmentStage !== undefined)
      updateData.developmentStage = body.developmentStage;
    if (body.units !== undefined)
      updateData.units = body.units ? parseInt(body.units) : null;
    if (body.squareFeet !== undefined)
      updateData.squareFeet = body.squareFeet ? parseInt(body.squareFeet) : null;
    if (body.acquisitionDate !== undefined)
      updateData.acquisitionDate = body.acquisitionDate
        ? new Date(body.acquisitionDate)
        : null;
    if (body.holdPeriodYears !== undefined)
      updateData.holdPeriodYears = body.holdPeriodYears
        ? parseInt(body.holdPeriodYears)
        : null;

    // Executive Summary
    if (body.purchasePrice !== undefined)
      updateData.purchasePrice = parseFloat(body.purchasePrice);
    if (body.equityInvested !== undefined)
      updateData.equityInvested = parseFloat(body.equityInvested);
    if (body.debtAmount !== undefined)
      updateData.debtAmount = parseFloat(body.debtAmount);
    if (body.targetIRR !== undefined)
      updateData.targetIRR = body.targetIRR ? parseFloat(body.targetIRR) : null;
    if (body.targetCashOnCash !== undefined)
      updateData.targetCashOnCash = body.targetCashOnCash
        ? parseFloat(body.targetCashOnCash)
        : null;
    if (body.statusIndicator !== undefined)
      updateData.statusIndicator = body.statusIndicator;

    // Capital Stack
    if (body.hardCosts !== undefined)
      updateData.hardCosts = parseFloat(body.hardCosts) || 0;
    if (body.softCosts !== undefined)
      updateData.softCosts = parseFloat(body.softCosts) || 0;
    if (body.financingCosts !== undefined)
      updateData.financingCosts = parseFloat(body.financingCosts) || 0;
    if (body.contingency !== undefined)
      updateData.contingency = parseFloat(body.contingency) || 0;

    // Recalculate total project cost if any cost components changed
    if (
      body.purchasePrice !== undefined ||
      body.hardCosts !== undefined ||
      body.softCosts !== undefined ||
      body.financingCosts !== undefined ||
      body.contingency !== undefined
    ) {
      const purchasePrice =
        updateData.purchasePrice ?? existingProperty.purchasePrice;
      const hardCosts = updateData.hardCosts ?? existingProperty.hardCosts;
      const softCosts = updateData.softCosts ?? existingProperty.softCosts;
      const financingCosts =
        updateData.financingCosts ?? existingProperty.financingCosts;
      const contingency = updateData.contingency ?? existingProperty.contingency;

      updateData.totalProjectCost =
        purchasePrice + hardCosts + softCosts + financingCosts + contingency;
    }

    // Debt Details
    if (body.debtInterestRate !== undefined)
      updateData.debtInterestRate = body.debtInterestRate
        ? parseFloat(body.debtInterestRate)
        : null;
    if (body.debtTermYears !== undefined)
      updateData.debtTermYears = body.debtTermYears
        ? parseInt(body.debtTermYears)
        : null;
    if (body.debtAmortizationYears !== undefined)
      updateData.debtAmortizationYears = body.debtAmortizationYears
        ? parseInt(body.debtAmortizationYears)
        : null;

    // Operating Assumptions
    if (body.avgMonthlyRentPerUnit !== undefined)
      updateData.avgMonthlyRentPerUnit = parseFloat(body.avgMonthlyRentPerUnit);
    if (body.otherIncomeMonthly !== undefined)
      updateData.otherIncomeMonthly = parseFloat(body.otherIncomeMonthly);
    if (body.vacancyRate !== undefined)
      updateData.vacancyRate = parseFloat(body.vacancyRate);
    if (body.expenseRatio !== undefined)
      updateData.expenseRatio = parseFloat(body.expenseRatio);
    if (body.annualRentGrowthRate !== undefined)
      updateData.annualRentGrowthRate = parseFloat(body.annualRentGrowthRate);
    if (body.annualExpenseGrowthRate !== undefined)
      updateData.annualExpenseGrowthRate = parseFloat(
        body.annualExpenseGrowthRate
      );

    // Exit Assumptions
    if (body.exitCapRate !== undefined)
      updateData.exitCapRate = parseFloat(body.exitCapRate);
    if (body.saleCostPercentage !== undefined)
      updateData.saleCostPercentage = parseFloat(body.saleCostPercentage);

    // Relationships
    if (body.projectId !== undefined) updateData.projectId = body.projectId || null;

    // Update the property
    const property = await prisma.property.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json({ property });
  } catch (error) {
    console.error('Error updating property:', error);
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const property = await prisma.property.findUnique({
      where: { id: params.id },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    await prisma.property.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}
