/**
 * Financial Calculations for Real Estate Development
 * Implements all formulas for property analysis, returns, and projections
 */

export interface PropertyFinancials {
  // Input values from database
  purchasePrice: number;
  hardCosts: number;
  softCosts: number;
  financingCosts: number;
  contingency: number;
  equityInvested: number;
  debtAmount: number;
  debtInterestRate: number;
  debtTermYears: number;
  debtAmortizationYears: number;
  units: number;
  avgMonthlyRentPerUnit: number;
  otherIncomeMonthly: number;
  vacancyRate: number;
  expenseRatio: number;
  annualRentGrowthRate: number;
  annualExpenseGrowthRate: number;
  exitCapRate: number;
  saleCostPercentage: number;
  holdPeriodYears: number;
}

export interface CalculatedFinancials {
  // Capital Stack
  totalProjectCost: number;
  equityPercentage: number;
  ltv: number;

  // Operating Analysis (Year 1)
  grossPotentialRentAnnual: number;
  effectiveGrossIncome: number;
  operatingExpenses: number;
  netOperatingIncome: number;

  // Cash Flow Analysis
  monthlyRentIncome: number;
  monthlyOperatingExpenses: number;
  monthlyDebtService: number;
  monthlyNetCashFlow: number;
  annualNetCashFlow: number;

  // Performance Metrics
  breakEvenOccupancy: number;
  dscr: number;
  cashOnCashReturn: number;
  yieldOnCost: number;

  // Exit Analysis
  grossSalePrice: number;
  remainingLoanBalance: number;
  netSaleProceeds: number;
  totalProfit: number;
  equityMultiple: number;

  // Multi-year projections
  projections: YearlyProjection[];
  irr: number;
}

export interface YearlyProjection {
  year: number;
  grossPotentialRent: number;
  effectiveGrossIncome: number;
  operatingExpenses: number;
  netOperatingIncome: number;
  debtService: number;
  cashFlow: number;
  remainingLoanBalance: number;
}

/**
 * Calculate monthly debt service payment using PMT formula
 * PMT = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
 */
function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  amortizationYears: number
): number {
  if (principal === 0 || annualRate === 0) return 0;
  
  const monthlyRate = annualRate / 12;
  const numberOfPayments = amortizationYears * 12;
  
  const payment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  
  return payment;
}

/**
 * Calculate remaining loan balance after n payments
 */
function calculateRemainingBalance(
  principal: number,
  annualRate: number,
  amortizationYears: number,
  yearsPaid: number
): number {
  if (principal === 0 || annualRate === 0) return 0;
  if (yearsPaid >= amortizationYears) return 0;
  
  const monthlyRate = annualRate / 12;
  const totalPayments = amortizationYears * 12;
  const paymentsMade = yearsPaid * 12;
  const paymentsRemaining = totalPayments - paymentsMade;
  
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, amortizationYears);
  
  const remainingBalance =
    (monthlyPayment * (Math.pow(1 + monthlyRate, paymentsRemaining) - 1)) /
    (monthlyRate * Math.pow(1 + monthlyRate, paymentsRemaining));
  
  return remainingBalance;
}

/**
 * Calculate Internal Rate of Return (IRR) using Newton's method
 */
function calculateIRR(cashFlows: number[], guess: number = 0.1): number {
  const maxIterations = 100;
  const tolerance = 0.0001;
  
  let irr = guess;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;
    
    for (let j = 0; j < cashFlows.length; j++) {
      npv += cashFlows[j] / Math.pow(1 + irr, j);
      dnpv += (-j * cashFlows[j]) / Math.pow(1 + irr, j + 1);
    }
    
    const newIrr = irr - npv / dnpv;
    
    if (Math.abs(newIrr - irr) < tolerance) {
      return newIrr;
    }
    
    irr = newIrr;
  }
  
  return irr;
}

/**
 * Main calculation function - computes all financial metrics
 */
export function calculateFinancials(
  inputs: PropertyFinancials
): CalculatedFinancials {
  // Capital Stack Calculations
  const totalProjectCost =
    inputs.purchasePrice +
    inputs.hardCosts +
    inputs.softCosts +
    inputs.financingCosts +
    inputs.contingency;

  const equityPercentage =
    totalProjectCost > 0 ? inputs.equityInvested / totalProjectCost : 0;

  const ltv = totalProjectCost > 0 ? inputs.debtAmount / totalProjectCost : 0;

  // Operating Analysis (Year 1)
  const grossPotentialRentAnnual =
    inputs.avgMonthlyRentPerUnit * inputs.units * 12;

  const effectiveGrossIncome =
    (grossPotentialRentAnnual + inputs.otherIncomeMonthly * 12) *
    (1 - inputs.vacancyRate);

  const operatingExpenses = effectiveGrossIncome * inputs.expenseRatio;

  const netOperatingIncome = effectiveGrossIncome - operatingExpenses;

  // Cash Flow Analysis
  const monthlyRentIncome = effectiveGrossIncome / 12;

  const monthlyOperatingExpenses = operatingExpenses / 12;

  const monthlyDebtService = calculateMonthlyPayment(
    inputs.debtAmount,
    inputs.debtInterestRate,
    inputs.debtAmortizationYears
  );

  const monthlyNetCashFlow =
    monthlyRentIncome - monthlyOperatingExpenses - monthlyDebtService;

  const annualNetCashFlow = monthlyNetCashFlow * 12;

  // Performance Metrics
  const breakEvenOccupancy =
    monthlyRentIncome > 0
      ? (monthlyOperatingExpenses + monthlyDebtService) / monthlyRentIncome
      : 0;

  const annualDebtService = monthlyDebtService * 12;
  const dscr =
    annualDebtService > 0 ? netOperatingIncome / annualDebtService : 0;

  const cashOnCashReturn =
    inputs.equityInvested > 0 ? annualNetCashFlow / inputs.equityInvested : 0;

  const yieldOnCost =
    totalProjectCost > 0 ? netOperatingIncome / totalProjectCost : 0;

  // Multi-year projections
  const projections: YearlyProjection[] = [];
  let cumulativeCashFlow = -inputs.equityInvested; // Initial investment
  const cashFlows: number[] = [-inputs.equityInvested]; // For IRR calculation

  for (let year = 1; year <= inputs.holdPeriodYears; year++) {
    const growthFactor = Math.pow(1 + inputs.annualRentGrowthRate, year - 1);
    const expenseGrowthFactor = Math.pow(
      1 + inputs.annualExpenseGrowthRate,
      year - 1
    );

    const yearGrossPotentialRent = grossPotentialRentAnnual * growthFactor;
    const yearEffectiveGrossIncome =
      (yearGrossPotentialRent + inputs.otherIncomeMonthly * 12) *
      (1 - inputs.vacancyRate);
    const yearOperatingExpenses =
      operatingExpenses * expenseGrowthFactor;
    const yearNetOperatingIncome =
      yearEffectiveGrossIncome - yearOperatingExpenses;
    const yearCashFlow = yearNetOperatingIncome - annualDebtService;

    const remainingBalance = calculateRemainingBalance(
      inputs.debtAmount,
      inputs.debtInterestRate,
      inputs.debtAmortizationYears,
      year
    );

    projections.push({
      year,
      grossPotentialRent: yearGrossPotentialRent,
      effectiveGrossIncome: yearEffectiveGrossIncome,
      operatingExpenses: yearOperatingExpenses,
      netOperatingIncome: yearNetOperatingIncome,
      debtService: annualDebtService,
      cashFlow: yearCashFlow,
      remainingLoanBalance: remainingBalance,
    });

    cashFlows.push(yearCashFlow);
    cumulativeCashFlow += yearCashFlow;
  }

  // Exit Analysis (at end of hold period)
  const finalYearNOI =
    projections[projections.length - 1]?.netOperatingIncome || netOperatingIncome;
  const grossSalePrice = finalYearNOI / inputs.exitCapRate;

  const remainingLoanBalance =
    projections[projections.length - 1]?.remainingLoanBalance || 0;

  const saleCosts = grossSalePrice * inputs.saleCostPercentage;
  const netSaleProceeds = grossSalePrice - saleCosts - remainingLoanBalance;

  // Add sale proceeds to final year cash flow for IRR
  cashFlows[cashFlows.length - 1] += netSaleProceeds;

  const totalCashDistributed = cumulativeCashFlow;
  const equityMultiple =
    inputs.equityInvested > 0
      ? (totalCashDistributed + netSaleProceeds) / inputs.equityInvested
      : 0;

  const totalProfit =
    totalCashDistributed + netSaleProceeds - inputs.equityInvested;

  // Calculate IRR
  const irr = calculateIRR(cashFlows);

  return {
    // Capital Stack
    totalProjectCost,
    equityPercentage,
    ltv,

    // Operating Analysis
    grossPotentialRentAnnual,
    effectiveGrossIncome,
    operatingExpenses,
    netOperatingIncome,

    // Cash Flow Analysis
    monthlyRentIncome,
    monthlyOperatingExpenses,
    monthlyDebtService,
    monthlyNetCashFlow,
    annualNetCashFlow,

    // Performance Metrics
    breakEvenOccupancy,
    dscr,
    cashOnCashReturn,
    yieldOnCost,

    // Exit Analysis
    grossSalePrice,
    remainingLoanBalance,
    netSaleProceeds,
    totalProfit,
    equityMultiple,

    // Multi-year
    projections,
    irr,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format large numbers with K/M suffixes
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return formatCurrency(value);
}
