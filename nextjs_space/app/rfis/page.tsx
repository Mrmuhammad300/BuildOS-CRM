'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BackButton } from '@/components/ui/back-button';
import { Plus, Search, MessageSquare, ArrowRight } from 'lucide-react';

type RFI = {
  id: string;
  rfiNumber: string;
  subject: string;
  priority: string;
  status: string;
  dueDate?: string;
  project: { name: string };
  submittedBy: { firstName: string; lastName: string };
  _count?: { comments: number; responses: number };
};

export default function RFIsPage() {
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [filteredRfis, setFilteredRfis] = useState<RFI[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    fetch('/api/rfis').then(r => r.ok && r.json()).then(d => { setRfis(d?.rfis ?? []); setLoading(false); });
  }, []);

  useEffect(() => {
    let filtered = [...rfis];
    if (search) filtered = filtered?.filter(r => r?.subject?.toLowerCase()?.includes(search?.toLowerCase()) || r?.rfiNumber?.toLowerCase()?.includes(search?.toLowerCase())) ?? [];
    if (statusFilter !== 'all') filtered = filtered?.filter(r => r?.status === statusFilter) ?? [];
    if (priorityFilter !== 'all') filtered = filtered?.filter(r => r?.priority === priorityFilter) ?? [];
    setFilteredRfis(filtered);
  }, [rfis, search, statusFilter, priorityFilter]);

  const getStatusColor = (s: string) => ({
    Open: 'bg-blue-100 text-blue-700',
    InReview: 'bg-yellow-100 text-yellow-700',
    DraftResponse: 'bg-purple-100 text-purple-700',
    OfficialResponse: 'bg-green-100 text-green-700',
    Closed: 'bg-gray-100 text-gray-700'
  }[s] ?? 'bg-gray-100 text-gray-700');

  const getPriorityColor = (p: string) => ({
    Low: 'bg-gray-100 text-gray-700',
    Normal: 'bg-blue-100 text-blue-700',
    High: 'bg-orange-100 text-orange-700',
    Critical: 'bg-red-100 text-red-700'
  }[p] ?? 'bg-gray-100 text-gray-700');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <BackButton />
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-3xl font-bold mb-2">RFIs</h1><p className="text-gray-600">Request for Information management</p></div>
        <Link href="/rfis/new"><Button className="bg-gradient-to-r from-blue-600 to-orange-500"><Plus className="w-4 h-4 mr-2" />New RFI</Button></Link>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search RFIs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div>
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="Open">Open</SelectItem><SelectItem value="InReview">In Review</SelectItem><SelectItem value="DraftResponse">Draft Response</SelectItem><SelectItem value="OfficialResponse">Official Response</SelectItem><SelectItem value="Closed">Closed</SelectItem></SelectContent></Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}><SelectTrigger><SelectValue placeholder="All Priorities" /></SelectTrigger><SelectContent><SelectItem value="all">All Priorities</SelectItem><SelectItem value="Low">Low</SelectItem><SelectItem value="Normal">Normal</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Critical">Critical</SelectItem></SelectContent></Select>
          </div>
        </CardContent>
      </Card>

      {loading ? <div className="text-center py-12">Loading...</div> : filteredRfis?.length === 0 ? <div className="text-center py-12"><MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" /><p className="text-gray-600 mb-4">{search || statusFilter !== 'all' || priorityFilter !== 'all' ? 'No RFIs match your filters' : 'No RFIs yet'}</p>{!search && statusFilter === 'all' && priorityFilter === 'all' && <Link href="/rfis/new"><Button>Create your first RFI</Button></Link>}</div> : (
        <div className="space-y-4">
          {filteredRfis?.map(rfi => (
            <Link key={rfi.id} href={`/rfis/${rfi.id}`}>
              <Card className="hover:shadow-lg transition-all group">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">{rfi.subject}</h3>
                        <Badge className={getPriorityColor(rfi.priority)}>{rfi.priority}</Badge>
                        <Badge className={getStatusColor(rfi.status)}>{rfi.status === 'InReview' ? 'In Review' : rfi.status === 'DraftResponse' ? 'Draft Response' : rfi.status === 'OfficialResponse' ? 'Official Response' : rfi.status}</Badge>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span className="font-medium">{rfi.rfiNumber}</span>
                        <span>{rfi.project?.name}</span>
                        <span>By: {rfi.submittedBy?.firstName} {rfi.submittedBy?.lastName}</span>
                        {rfi.dueDate && <span>Due: {new Date(rfi.dueDate).toLocaleDateString()}</span>}
                      </div>
                      {rfi._count && <div className="flex gap-4 mt-3 text-xs text-gray-500"><span>{rfi._count.responses} responses</span><span>{rfi._count.comments} comments</span></div>}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
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
