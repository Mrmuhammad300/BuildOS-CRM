'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BackButton } from '@/components/ui/back-button';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

type Project = { id: string; name: string; projectNumber: string };
type User = { id: string; firstName: string; lastName: string };

export default function NewRFIPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    projectId: searchParams?.get('project') ?? '',
    subject: '', question: '', drawingReference: '', specSection: '', priority: 'Normal',
    dueDate: '', costImpact: false, scheduleImpact: false, estimatedDelayDays: '', assignedToId: ''
  });

  useEffect(() => {
    Promise.all([fetch('/api/projects'), fetch('/api/users')]).then(async ([p, u]) => {
      if (p.ok) setProjects((await p.json())?.projects ?? []);
      if (u.ok) setUsers((await u.json())?.users ?? []);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/rfis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); setLoading(false); return; }
      router.push(`/rfis/${data.rfi.id}`);
    } catch (err) { setError('An error occurred'); setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <BackButton fallbackUrl="/rfis" />
      <Card>
        <CardHeader><CardTitle className="text-2xl">Submit New RFI</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}
            
            <div className="space-y-4">
              <div className="space-y-2"><Label>Project *</Label><Select value={formData.projectId} onValueChange={(v) => setFormData({ ...formData, projectId: v })} disabled={loading}><SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger><SelectContent>{projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.projectNumber})</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="subject">Subject *</Label><Input id="subject" placeholder="Brief description" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required disabled={loading} /></div>
              <div className="space-y-2"><Label htmlFor="question">Question/Details *</Label><Textarea id="question" placeholder="Detailed question..." value={formData.question} onChange={(e) => setFormData({ ...formData, question: e.target.value })} required disabled={loading} rows={5} /></div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="drawingReference">Drawing Reference</Label><Input id="drawingReference" placeholder="A-101, Detail 5" value={formData.drawingReference} onChange={(e) => setFormData({ ...formData, drawingReference: e.target.value })} disabled={loading} /></div>
              <div className="space-y-2"><Label htmlFor="specSection">Spec Section</Label><Input id="specSection" placeholder="03 30 00" value={formData.specSection} onChange={(e) => setFormData({ ...formData, specSection: e.target.value })} disabled={loading} /></div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Priority</Label><Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })} disabled={loading}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Normal">Normal</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Critical">Critical</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="dueDate">Due Date</Label><Input id="dueDate" type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} disabled={loading} /></div>
              <div className="space-y-2"><Label htmlFor="estimatedDelayDays">Est. Delay (days)</Label><Input id="estimatedDelayDays" type="number" value={formData.estimatedDelayDays} onChange={(e) => setFormData({ ...formData, estimatedDelayDays: e.target.value })} disabled={loading} /></div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2"><input type="checkbox" id="costImpact" checked={formData.costImpact} onChange={(e) => setFormData({ ...formData, costImpact: e.target.checked })} disabled={loading} className="w-4 h-4" /><Label htmlFor="costImpact">Cost Impact</Label></div>
              <div className="flex items-center space-x-2"><input type="checkbox" id="scheduleImpact" checked={formData.scheduleImpact} onChange={(e) => setFormData({ ...formData, scheduleImpact: e.target.checked })} disabled={loading} className="w-4 h-4" /><Label htmlFor="scheduleImpact">Schedule Impact</Label></div>
            </div>

            <div className="space-y-2"><Label>Assign To</Label><Select value={formData.assignedToId} onValueChange={(v) => setFormData({ ...formData, assignedToId: v })} disabled={loading}><SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger><SelectContent>{users?.filter(u => u && ((u as any).role === 'Architect' || (u as any).role === 'Engineer'))?.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role})</SelectItem>)}</SelectContent></Select></div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-orange-500" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : <><Save className="mr-2 h-4 w-4" />Submit RFI</>}</Button>
              <Link href="/rfis"><Button type="button" variant="outline" disabled={loading}>Cancel</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
