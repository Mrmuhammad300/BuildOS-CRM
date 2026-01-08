'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/ui/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, DollarSign, TrendingUp, Building2, Calendar, AlertCircle } from 'lucide-react';
import { formatCurrency, formatPercentage, formatCompactNumber } from '@/lib/financial-calculations';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [financials, setFinancials] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) fetchProperty();
  }, [params?.id]);

  const fetchProperty = async () => {
    try {
      const response = await fetch(`/api/properties/${params?.id}`);
      if (response.ok) {
        const data = await response.json();
        setProperty(data.property);
        setFinancials(data.financials);
      }
    } catch (error) {
      console.error('Error fetching property:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-center"><p className="text-gray-600">Loading property...</p></div>;
  }

  if (!property) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-center"><p className="text-gray-600">Property not found</p></div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Green': return 'bg-green-100 text-green-700 border-green-300';
      case 'Yellow': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Red': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <BackButton fallbackUrl="/properties" />
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{property.name}</h1>
            <Badge className={getStatusColor(property.statusIndicator)}>{property.statusIndicator}</Badge>
          </div>
          <p className="text-gray-600">{property.street}, {property.city}, {property.state} {property.zip}</p>
        </div>
        <Button onClick={() => router.push(`/properties/${property.id}/edit`)} variant="outline"><Edit className="w-4 h-4 mr-2" />Edit</Button>
      </div>

      {/* Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-gray-600 flex items-center"><DollarSign className="w-4 h-4 mr-2" />Total Project Cost</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCompactNumber(property.totalProjectCost)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-gray-600 flex items-center"><Building2 className="w-4 h-4 mr-2" />Equity Invested</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCompactNumber(property.equityInvested)}</div><p className="text-xs text-gray-500 mt-1">{formatPercentage(property.equityInvested / property.totalProjectCost)} of total</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-gray-600 flex items-center"><TrendingUp className="w-4 h-4 mr-2" />Target IRR</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{property.targetIRR ? formatPercentage(property.targetIRR) : 'N/A'}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-gray-600 flex items-center"><Calendar className="w-4 h-4 mr-2" />Hold Period</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{property.holdPeriodYears || 'N/A'} yrs</div></CardContent>
        </Card>
      </div>

      {financials ? (
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
            <TabsTrigger value="capital">Capital Stack</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="projections">Projections</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4 mt-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card><CardHeader><CardTitle className="text-sm">NOI (Year 1)</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{formatCurrency(financials.netOperatingIncome)}</p></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm">Cash-on-Cash Return</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{formatPercentage(financials.cashOnCashReturn)}</p></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm">DSCR</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{financials.dscr.toFixed(2)}x</p></CardContent></Card>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Card><CardHeader><CardTitle className="text-sm">Projected IRR</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{formatPercentage(financials.irr)}</p></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm">Equity Multiple</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{financials.equityMultiple.toFixed(2)}x</p></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm">Break-Even Occupancy</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{formatPercentage(financials.breakEvenOccupancy)}</p></CardContent></Card>
            </div>
            <Card>
              <CardHeader><CardTitle>Exit Analysis</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-600">Gross Sale Price</p><p className="text-lg font-semibold">{formatCurrency(financials.grossSalePrice)}</p></div>
                  <div><p className="text-sm text-gray-600">Net Sale Proceeds</p><p className="text-lg font-semibold">{formatCurrency(financials.netSaleProceeds)}</p></div>
                  <div><p className="text-sm text-gray-600">Total Profit</p><p className="text-lg font-semibold">{formatCurrency(financials.totalProfit)}</p></div>
                  <div><p className="text-sm text-gray-600">Remaining Loan Balance</p><p className="text-lg font-semibold">{formatCurrency(financials.remainingLoanBalance)}</p></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="capital" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle>Capital Stack Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between"><span>Purchase Price</span><span className="font-semibold">{formatCurrency(property.purchasePrice)}</span></div>
                  <div className="flex justify-between"><span>Hard Costs</span><span className="font-semibold">{formatCurrency(property.hardCosts)}</span></div>
                  <div className="flex justify-between"><span>Soft Costs</span><span className="font-semibold">{formatCurrency(property.softCosts)}</span></div>
                  <div className="flex justify-between"><span>Financing Costs</span><span className="font-semibold">{formatCurrency(property.financingCosts)}</span></div>
                  <div className="flex justify-between"><span>Contingency</span><span className="font-semibold">{formatCurrency(property.contingency)}</span></div>
                  <div className="border-t pt-2 flex justify-between font-bold"><span>Total Project Cost</span><span>{formatCurrency(financials.totalProjectCost)}</span></div>
                </div>
              </CardContent>
            </Card>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle>Equity</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(property.equityInvested)}</p>
                  <p className="text-sm text-gray-600 mt-1">{formatPercentage(financials.equityPercentage)} of total</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Debt</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(property.debtAmount)}</p>
                  <p className="text-sm text-gray-600 mt-1">LTV: {formatPercentage(financials.ltv)}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatPercentage(property.debtInterestRate)} rate, {property.debtTermYears}yr term</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="operations" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle>Year 1 Operating Analysis</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between"><span>Gross Potential Rent</span><span className="font-semibold">{formatCurrency(financials.grossPotentialRentAnnual)}</span></div>
                  <div className="flex justify-between"><span>Vacancy Loss ({formatPercentage(property.vacancyRate)})</span><span className="font-semibold text-red-600">-{formatCurrency(financials.grossPotentialRentAnnual * property.vacancyRate)}</span></div>
                  <div className="flex justify-between"><span>Effective Gross Income</span><span className="font-semibold">{formatCurrency(financials.effectiveGrossIncome)}</span></div>
                  <div className="flex justify-between"><span>Operating Expenses ({formatPercentage(property.expenseRatio)})</span><span className="font-semibold text-red-600">-{formatCurrency(financials.operatingExpenses)}</span></div>
                  <div className="border-t pt-2 flex justify-between font-bold"><span>Net Operating Income</span><span>{formatCurrency(financials.netOperatingIncome)}</span></div>
                  <div className="flex justify-between"><span>Annual Debt Service</span><span className="font-semibold text-red-600">-{formatCurrency(financials.monthlyDebtService * 12)}</span></div>
                  <div className="border-t pt-2 flex justify-between font-bold text-green-700"><span>Annual Net Cash Flow</span><span>{formatCurrency(financials.annualNetCashFlow)}</span></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projections" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle>Multi-Year Projections</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr><th className="text-left p-2">Year</th><th className="text-right p-2">EGI</th><th className="text-right p-2">Expenses</th><th className="text-right p-2">NOI</th><th className="text-right p-2">Debt Service</th><th className="text-right p-2">Cash Flow</th><th className="text-right p-2">Loan Balance</th></tr>
                    </thead>
                    <tbody>
                      {financials.projections.map((proj: any) => (
                        <tr key={proj.year} className="border-b">
                          <td className="p-2">{proj.year}</td>
                          <td className="text-right p-2">{formatCompactNumber(proj.effectiveGrossIncome)}</td>
                          <td className="text-right p-2">{formatCompactNumber(proj.operatingExpenses)}</td>
                          <td className="text-right p-2 font-semibold">{formatCompactNumber(proj.netOperatingIncome)}</td>
                          <td className="text-right p-2">{formatCompactNumber(proj.debtService)}</td>
                          <td className="text-right p-2 font-semibold text-green-700">{formatCompactNumber(proj.cashFlow)}</td>
                          <td className="text-right p-2">{formatCompactNumber(proj.remainingLoanBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="w-5 h-5" />
              <p>Financial analysis requires property to have units, equity, and hold period configured.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
