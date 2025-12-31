'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

type Project = { id: string; name: string; projectNumber: string };

export default function NewDailyReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    projectId: searchParams?.get('project') ?? '', date: new Date().toISOString().split('T')[0],
    weatherCondition: '', temperatureHigh: '', temperatureLow: '', precipitation: '', windSpeed: '',
    contractorWorkers: '', subcontractorWorkers: '', tradesOnSite: '',
    workPerformed: '', equipmentOnSite: '', materialsDelivered: '',
    incidentsCount: '', nearMissesCount: '', safetyViolations: '', ppeComplianceStatus: '',
    issuesAndDelays: '', inspectionsConducted: ''
  });

  useEffect(() => {
    fetch('/api/projects').then(r => r.ok && r.json()).then(d => setProjects(d?.projects ?? []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const data = {
      ...formData,
      tradesOnSite: formData.tradesOnSite.split(',').map(t => t.trim()).filter(Boolean),
      equipmentOnSite: formData.equipmentOnSite.split(',').map(e => e.trim()).filter(Boolean),
      materialsDelivered: formData.materialsDelivered.split(',').map(m => m.trim()).filter(Boolean),
      safetyViolations: formData.safetyViolations.split(',').map(s => s.trim()).filter(Boolean),
      inspectionsConducted: formData.inspectionsConducted.split(',').map(i => i.trim()).filter(Boolean)
    };

    try {
      const res = await fetch('/api/daily-reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await res.json();
      if (!res.ok) { setError(result.error || 'Failed'); setLoading(false); return; }
      router.push(`/daily-reports/${result.report.id}`);
    } catch (err) { setError('An error occurred'); setLoading(false); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <BackButton fallbackUrl="/daily-reports" />
      <Card>
        <CardHeader><CardTitle className="text-2xl">Submit Daily Report</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Project *</Label><Select value={formData.projectId} onValueChange={(v) => setFormData({ ...formData, projectId: v })} disabled={loading}><SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger><SelectContent>{projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="date">Date *</Label><Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required disabled={loading} /></div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Weather</h3>
              <div className="grid md:grid-cols-5 gap-4">
                <div className="space-y-2"><Label>Condition</Label><Select value={formData.weatherCondition} onValueChange={(v) => setFormData({ ...formData, weatherCondition: v })} disabled={loading}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Clear">Clear</SelectItem><SelectItem value="PartlyCloudy">Partly Cloudy</SelectItem><SelectItem value="Cloudy">Cloudy</SelectItem><SelectItem value="Rain">Rain</SelectItem><SelectItem value="Snow">Snow</SelectItem><SelectItem value="Fog">Fog</SelectItem><SelectItem value="Wind">Wind</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label htmlFor="temperatureHigh">High (°F)</Label><Input id="temperatureHigh" type="number" value={formData.temperatureHigh} onChange={(e) => setFormData({ ...formData, temperatureHigh: e.target.value })} disabled={loading} /></div>
                <div className="space-y-2"><Label htmlFor="temperatureLow">Low (°F)</Label><Input id="temperatureLow" type="number" value={formData.temperatureLow} onChange={(e) => setFormData({ ...formData, temperatureLow: e.target.value })} disabled={loading} /></div>
                <div className="space-y-2"><Label htmlFor="precipitation">Precip (in)</Label><Input id="precipitation" type="number" step="0.01" value={formData.precipitation} onChange={(e) => setFormData({ ...formData, precipitation: e.target.value })} disabled={loading} /></div>
                <div className="space-y-2"><Label htmlFor="windSpeed">Wind (mph)</Label><Input id="windSpeed" type="number" value={formData.windSpeed} onChange={(e) => setFormData({ ...formData, windSpeed: e.target.value })} disabled={loading} /></div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Workforce</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label htmlFor="contractorWorkers">Contractor Workers</Label><Input id="contractorWorkers" type="number" value={formData.contractorWorkers} onChange={(e) => setFormData({ ...formData, contractorWorkers: e.target.value })} disabled={loading} /></div>
                <div className="space-y-2"><Label htmlFor="subcontractorWorkers">Subcontractor Workers</Label><Input id="subcontractorWorkers" type="number" value={formData.subcontractorWorkers} onChange={(e) => setFormData({ ...formData, subcontractorWorkers: e.target.value })} disabled={loading} /></div>
                <div className="space-y-2"><Label htmlFor="tradesOnSite">Trades On Site (comma-separated)</Label><Input id="tradesOnSite" placeholder="Electrical, Plumbing, HVAC" value={formData.tradesOnSite} onChange={(e) => setFormData({ ...formData, tradesOnSite: e.target.value })} disabled={loading} /></div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Work Performed</h3>
              <div className="space-y-2"><Textarea id="workPerformed" placeholder="Describe work completed today..." value={formData.workPerformed} onChange={(e) => setFormData({ ...formData, workPerformed: e.target.value })} disabled={loading} rows={4} /></div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="equipmentOnSite">Equipment (comma-separated)</Label><Input id="equipmentOnSite" placeholder="Crane, Excavator" value={formData.equipmentOnSite} onChange={(e) => setFormData({ ...formData, equipmentOnSite: e.target.value })} disabled={loading} /></div>
                <div className="space-y-2"><Label htmlFor="materialsDelivered">Materials Delivered (comma-separated)</Label><Input id="materialsDelivered" placeholder="Steel, Concrete" value={formData.materialsDelivered} onChange={(e) => setFormData({ ...formData, materialsDelivered: e.target.value })} disabled={loading} /></div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Safety</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="incidentsCount">Incidents Count</Label><Input id="incidentsCount" type="number" value={formData.incidentsCount} onChange={(e) => setFormData({ ...formData, incidentsCount: e.target.value })} disabled={loading} /></div>
                <div className="space-y-2"><Label htmlFor="nearMissesCount">Near Misses</Label><Input id="nearMissesCount" type="number" value={formData.nearMissesCount} onChange={(e) => setFormData({ ...formData, nearMissesCount: e.target.value })} disabled={loading} /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="safetyViolations">Violations (comma-separated)</Label><Input id="safetyViolations" value={formData.safetyViolations} onChange={(e) => setFormData({ ...formData, safetyViolations: e.target.value })} disabled={loading} /></div>
              <div className="space-y-2"><Label htmlFor="ppeComplianceStatus">PPE Compliance Status</Label><Input id="ppeComplianceStatus" placeholder="100% compliant" value={formData.ppeComplianceStatus} onChange={(e) => setFormData({ ...formData, ppeComplianceStatus: e.target.value })} disabled={loading} /></div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Issues & Inspections</h3>
              <div className="space-y-2"><Label htmlFor="issuesAndDelays">Issues and Delays</Label><Textarea id="issuesAndDelays" placeholder="Describe any issues..." value={formData.issuesAndDelays} onChange={(e) => setFormData({ ...formData, issuesAndDelays: e.target.value })} disabled={loading} rows={3} /></div>
              <div className="space-y-2"><Label htmlFor="inspectionsConducted">Inspections (comma-separated)</Label><Input id="inspectionsConducted" placeholder="Foundation, Electrical rough-in" value={formData.inspectionsConducted} onChange={(e) => setFormData({ ...formData, inspectionsConducted: e.target.value })} disabled={loading} /></div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-orange-500" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : <><Save className="mr-2 h-4 w-4" />Submit Report</>}</Button>
              <Link href="/daily-reports"><Button type="button" variant="outline" disabled={loading}>Cancel</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
