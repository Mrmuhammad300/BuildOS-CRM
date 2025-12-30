'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, FileText, Calendar } from 'lucide-react';

type Report = {
  id: string;
  date: string;
  project: { name: string; projectNumber: string };
  submittedBy: { firstName: string; lastName: string };
  weatherCondition?: string;
  contractorWorkers?: number;
  subcontractorWorkers?: number;
};

export default function DailyReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filtered, setFiltered] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');

  useEffect(() => {
    fetch('/api/daily-reports').then(r => r.ok && r.json()).then(d => { setReports(d?.reports ?? []); setLoading(false); });
  }, []);

  useEffect(() => {
    let f = [...reports];
    if (search) f = f?.filter(r => r?.project?.name?.toLowerCase()?.includes(search?.toLowerCase())) ?? [];
    if (projectFilter !== 'all') f = f?.filter(r => r?.project?.name === projectFilter) ?? [];
    setFiltered(f);
  }, [reports, search, projectFilter]);

  const projects = [...new Set(reports?.map(r => r?.project?.name))];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-3xl font-bold mb-2">Daily Reports</h1><p className="text-gray-600">Field progress and activity tracking</p></div>
        <Link href="/daily-reports/new"><Button className="bg-gradient-to-r from-blue-600 to-orange-500"><Plus className="w-4 h-4 mr-2" />New Report</Button></Link>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div>
            <Select value={projectFilter} onValueChange={setProjectFilter}><SelectTrigger><SelectValue placeholder="All Projects" /></SelectTrigger><SelectContent><SelectItem value="all">All Projects</SelectItem>{projects?.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
          </div>
        </CardContent>
      </Card>

      {loading ? <div className="text-center py-12">Loading...</div> : filtered?.length === 0 ? <div className="text-center py-12"><FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" /><p className="text-gray-600 mb-4">{search || projectFilter !== 'all' ? 'No reports match your filters' : 'No reports yet'}</p>{!search && projectFilter === 'all' && <Link href="/daily-reports/new"><Button>Create your first report</Button></Link>}</div> : (
        <div className="grid md:grid-cols-2 gap-6">
          {filtered?.map(report => (
            <Link key={report.id} href={`/daily-reports/${report.id}`}>
              <Card className="hover:shadow-lg transition-all group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">{report.project?.name}</h3>
                      <p className="text-sm text-gray-600">{report.project?.projectNumber}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-sm font-medium text-gray-900"><Calendar className="w-4 h-4 mr-1" />{new Date(report.date).toLocaleDateString()}</div>
                      <p className="text-xs text-gray-600 mt-1">{report.submittedBy?.firstName} {report.submittedBy?.lastName}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600 border-t pt-3 mt-3">
                    {report.weatherCondition && <span>Weather: {report.weatherCondition}</span>}
                    <span>Workers: {(report.contractorWorkers ?? 0) + (report.subcontractorWorkers ?? 0)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
