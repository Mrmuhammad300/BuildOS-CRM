'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BackButton } from '@/components/ui/back-button';
import { Save, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function NewPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '', street: '', city: '', state: '', zip: '',
    assetType: 'Residential', developmentStage: 'PreDevelopment',
    units: '', squareFeet: '', acquisitionDate: '', holdPeriodYears: '5',
    purchasePrice: '', hardCosts: '', softCosts: '', financingCosts: '', contingency: '',
    equityInvested: '', debtAmount: '', debtInterestRate: '0.05',
    debtTermYears: '30', debtAmortizationYears: '30',
    avgMonthlyRentPerUnit: '', otherIncomeMonthly: '',
    vacancyRate: '0.05', expenseRatio: '0.40',
    annualRentGrowthRate: '0.03', annualExpenseGrowthRate: '0.03',
    exitCapRate: '0.06', saleCostPercentage: '0.05',
    targetIRR: '', targetCashOnCash: '', statusIndicator: 'Green', projectId: 'none',
  });

  useEffect(() => {
    fetch('/api/projects').then(r => { if (r.ok) r.json().then(d => setProjects(d?.projects ?? [])); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, projectId: formData.projectId === "none" ? null : formData.projectId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to create property');
        setLoading(false);
        return;
      }
      router.push(`/properties/${data.property.id}`);
    } catch (err) { setError('An error occurred'); setLoading(false); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <BackButton fallbackUrl="/properties" />
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Property</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}
            
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="capital">Capital Stack</TabsTrigger>
                <TabsTrigger value="operations">Operations</TabsTrigger>
                <TabsTrigger value="exit">Exit</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4 mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Property Name *</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assetType">Asset Type</Label>
                    <Select value={formData.assetType} onValueChange={(v) => setFormData({ ...formData, assetType: v })} disabled={loading}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Residential">Residential</SelectItem>
                        <SelectItem value="Multifamily">Multifamily</SelectItem>
                        <SelectItem value="MixedUse">Mixed Use</SelectItem>
                        <SelectItem value="Industrial">Industrial</SelectItem>
                        <SelectItem value="Agricultural">Agricultural</SelectItem>
                        <SelectItem value="SpecialPurpose">Special Purpose</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input id="street" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} disabled={loading} />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input id="zip" value={formData.zip} onChange={(e) => setFormData({ ...formData, zip: e.target.value })} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="developmentStage">Stage</Label>
                    <Select value={formData.developmentStage} onValueChange={(v) => setFormData({ ...formData, developmentStage: v })} disabled={loading}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PreDevelopment">Pre-Development</SelectItem>
                        <SelectItem value="Construction">Construction</SelectItem>
                        <SelectItem value="Stabilized">Stabilized</SelectItem>
                        <SelectItem value="Exit">Exit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="units">Units</Label>
                    <Input id="units" type="number" value={formData.units} onChange={(e) => setFormData({ ...formData, units: e.target.value })} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="squareFeet">Square Feet</Label>
                    <Input id="squareFeet" type="number" value={formData.squareFeet} onChange={(e) => setFormData({ ...formData, squareFeet: e.target.value })} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="holdPeriodYears">Hold Period (Years)</Label>
                    <Input id="holdPeriodYears" type="number" value={formData.holdPeriodYears} onChange={(e) => setFormData({ ...formData, holdPeriodYears: e.target.value })} disabled={loading} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectId">Link to Project (Optional)</Label>
                  <Select value={formData.projectId} onValueChange={(v) => setFormData({ ...formData, projectId: v })} disabled={loading}>
                    <SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.projectNumber})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="capital" className="space-y-4 mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchasePrice">Purchase Price *</Label>
                    <Input id="purchasePrice" type="number" step="0.01" value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })} required disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hardCosts">Hard Costs</Label>
                    <Input id="hardCosts" type="number" step="0.01" value={formData.hardCosts} onChange={(e) => setFormData({ ...formData, hardCosts: e.target.value })} disabled={loading} />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="softCosts">Soft Costs</Label>
                    <Input id="softCosts" type="number" step="0.01" value={formData.softCosts} onChange={(e) => setFormData({ ...formData, softCosts: e.target.value })} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="financingCosts">Financing Costs</Label>
                    <Input id="financingCosts" type="number" step="0.01" value={formData.financingCosts} onChange={(e) => setFormData({ ...formData, financingCosts: e.target.value })} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contingency">Contingency</Label>
                    <Input id="contingency" type="number" step="0.01" value={formData.contingency} onChange={(e) => setFormData({ ...formData, contingency: e.target.value })} disabled={loading} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="equityInvested">Equity Invested</Label>
                    <Input id="equityInvested" type="number" step="0.01" value={formData.equityInvested} onChange={(e) => setFormData({ ...formData, equityInvested: e.target.value })} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="debtAmount">Debt Amount</Label>
                    <Input id="debtAmount" type="number" step="0.01" value={formData.debtAmount} onChange={(e) => setFormData({ ...formData, debtAmount: e.target.value })} disabled={loading} />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="debtInterestRate">Interest Rate</Label>
                    <Input id="debtInterestRate" type="number" step="0.001" value={formData.debtInterestRate} onChange={(e) => setFormData({ ...formData, debtInterestRate: e.target.value })} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="debtTermYears">Term (Years)</Label>
                    <Input id="debtTermYears" type="number" value={formData.debtTermYears} onChange={(e) => setFormData({ ...formData, debtTermYears: e.target.value })} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="debtAmortizationYears">Amortization (Years)</Label>
                    <Input id="debtAmortizationYears" type="number" value={formData.debtAmortizationYears} onChange={(e) => setFormData({ ...formData, debtAmortizationYears: e.target.value })} disabled={loading} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="operations" className="space-y-4 mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="avgMonthlyRentPerUnit">Avg Monthly Rent/Unit</Label>
                    <Input id="avgMonthlyRentPerUnit" type="number" step="0.01" value={formData.avgMonthlyRentPerUnit} onChange={(e) => setFormData({ ...formData, avgMonthlyRentPerUnit: e.target.value })} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otherIncomeMonthly">Other Income (Monthly)</Label>
                    <Input id="otherIncomeMonthly" type="number" step="0.01" value={formData.otherIncomeMonthly} onChange={(e) => setFormData({ ...formData, otherIncomeMonthly: e.target.value })} disabled={loading} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vacancyRate">Vacancy Rate (decimal)</Label>
                    <Input id="vacancyRate" type="number" step="0.01" value={formData.vacancyRate} onChange={(e) => setFormData({ ...formData, vacancyRate: e.target.value })} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expenseRatio">Expense Ratio (decimal)</Label>
                    <Input id="expenseRatio" type="number" step="0.01" value={formData.expenseRatio} onChange={(e) => setFormData({ ...formData, expenseRatio: e.target.value })} disabled={loading} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="annualRentGrowthRate">Annual Rent Growth (decimal)</Label>
                    <Input id="annualRentGrowthRate" type="number" step="0.001" value={formData.annualRentGrowthRate} onChange={(e) => setFormData({ ...formData, annualRentGrowthRate: e.target.value })} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="annualExpenseGrowthRate">Annual Expense Growth (decimal)</Label>
                    <Input id="annualExpenseGrowthRate" type="number" step="0.001" value={formData.annualExpenseGrowthRate} onChange={(e) => setFormData({ ...formData, annualExpenseGrowthRate: e.target.value })} disabled={loading} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="exit" className="space-y-4 mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exitCapRate">Exit Cap Rate (decimal)</Label>
                    <Input id="exitCapRate" type="number" step="0.001" value={formData.exitCapRate} onChange={(e) => setFormData({ ...formData, exitCapRate: e.target.value })} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="saleCostPercentage">Sale Cost % (decimal)</Label>
                    <Input id="saleCostPercentage" type="number" step="0.001" value={formData.saleCostPercentage} onChange={(e) => setFormData({ ...formData, saleCostPercentage: e.target.value })} disabled={loading} />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetIRR">Target IRR (decimal)</Label>
                    <Input id="targetIRR" type="number" step="0.001" value={formData.targetIRR} onChange={(e) => setFormData({ ...formData, targetIRR: e.target.value })} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetCashOnCash">Target Cash-on-Cash (decimal)</Label>
                    <Input id="targetCashOnCash" type="number" step="0.001" value={formData.targetCashOnCash} onChange={(e) => setFormData({ ...formData, targetCashOnCash: e.target.value })} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="statusIndicator">Status</Label>
                    <Select value={formData.statusIndicator} onValueChange={(v) => setFormData({ ...formData, statusIndicator: v })} disabled={loading}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Green">Green</SelectItem>
                        <SelectItem value="Yellow">Yellow</SelectItem>
                        <SelectItem value="Red">Red</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : <><Save className="w-4 h-4 mr-2" />Create Property</>}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
