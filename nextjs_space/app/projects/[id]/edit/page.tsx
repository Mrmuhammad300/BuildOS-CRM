'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BackButton } from '@/components/ui/back-button';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

type User = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
};

type Project = {
  id: string;
  name: string;
  client: string;
  projectNumber: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  startDate: string;
  estimatedCompletion: string;
  budget: number;
  status: string;
  phase: string;
  description?: string;
  projectManagerId?: string;
  superintendentId?: string;
  architectId?: string;
  engineerId?: string;
};

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '', client: '', projectNumber: '', address: '', city: '', state: '', zipCode: '',
    startDate: '', estimatedCompletion: '', budget: '', status: 'PreConstruction', phase: 'Planning',
    description: '', projectManagerId: '', superintendentId: '', architectId: '', engineerId: '',
  });

  useEffect(() => {
    // Fetch users
    fetch('/api/users').then(r => { if (r.ok) r.json().then(d => setUsers(d?.users ?? [])); });
    
    // Fetch project data
    if (params?.id) {
      fetch(`/api/projects/${params.id}`)
        .then(r => r.ok && r.json())
        .then(data => {
          if (data?.project) {
            const p = data.project;
            setFormData({
              name: p.name || '',
              client: p.client || '',
              projectNumber: p.projectNumber || '',
              address: p.address || '',
              city: p.city || '',
              state: p.state || '',
              zipCode: p.zipCode || '',
              startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '',
              estimatedCompletion: p.estimatedCompletion ? new Date(p.estimatedCompletion).toISOString().split('T')[0] : '',
              budget: p.budget?.toString() || '',
              status: p.status || 'PreConstruction',
              phase: p.phase || 'Planning',
              description: p.description || '',
              projectManagerId: p.projectManagerId || '',
              superintendentId: p.superintendentId || '',
              architectId: p.architectId || '',
              engineerId: p.engineerId || '',
            });
          }
          setFetchingData(false);
        })
        .catch(() => {
          setError('Failed to load project data');
          setFetchingData(false);
        });
    }
  }, [params?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${params?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to update project');
        setLoading(false);
        return;
      }
      router.push(`/projects/${params?.id}`);
    } catch (err) {
      setError('An error occurred');
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading project data...</p>
      </div>
    );
  }

  const projectManagers = users?.filter(u => u && (u.role === 'ProjectManager' || u.role === 'Admin')) ?? [];
  const superintendents = users?.filter(u => u && u.role === 'Superintendent') ?? [];
  const architects = users?.filter(u => u && u.role === 'Architect') ?? [];
  const engineers = users?.filter(u => u && u.role === 'Engineer') ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <BackButton fallbackUrl={`/projects/${params?.id}`} label="Back to Project" />
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Edit Project</CardTitle>
          <CardDescription>Update project details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input id="name" placeholder="Downtown Office" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectNumber">Project Number *</Label>
                  <Input id="projectNumber" placeholder="PRJ-2024-001" value={formData.projectNumber} onChange={(e) => setFormData({ ...formData, projectNumber: e.target.value })} required disabled={loading} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Input id="client" placeholder="Acme Corp" value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })} required disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Project scope..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} disabled={loading} rows={3} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Location</h3>
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input id="address" placeholder="123 Main St" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required disabled={loading} />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP</Label>
                  <Input id="zipCode" value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} disabled={loading} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Schedule & Budget</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start *</Label>
                  <Input id="startDate" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedCompletion">Est. Completion *</Label>
                  <Input id="estimatedCompletion" type="date" value={formData.estimatedCompletion} onChange={(e) => setFormData({ ...formData, estimatedCompletion: e.target.value })} required disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget *</Label>
                  <Input id="budget" type="number" placeholder="5000000" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} required disabled={loading} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })} disabled={loading}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PreConstruction">Pre-Construction</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="OnHold">On Hold</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Phase</Label>
                  <Select value={formData.phase} onValueChange={(v) => setFormData({ ...formData, phase: v })} disabled={loading}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="Foundation">Foundation</SelectItem>
                      <SelectItem value="Framing">Framing</SelectItem>
                      <SelectItem value="MEP">MEP</SelectItem>
                      <SelectItem value="Finishing">Finishing</SelectItem>
                      <SelectItem value="Closeout">Closeout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Team</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { key: 'projectManagerId', label: 'Project Manager', options: projectManagers },
                  { key: 'superintendentId', label: 'Superintendent', options: superintendents },
                  { key: 'architectId', label: 'Architect', options: architects },
                  { key: 'engineerId', label: 'Engineer', options: engineers },
                ].map(({ key, label, options }) => (
                  <div key={key} className="space-y-2">
                    <Label>{label}</Label>
                    <Select value={formData[key as keyof typeof formData] as string || "none"} onValueChange={(v) => setFormData({ ...formData, [key]: v === "none" ? "" : v })} disabled={loading}>
                      <SelectTrigger><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {options?.map((u: User) => <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-orange-500" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
              </Button>
              <Link href={`/projects/${params?.id}`}><Button type="button" variant="outline" disabled={loading}>Cancel</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
