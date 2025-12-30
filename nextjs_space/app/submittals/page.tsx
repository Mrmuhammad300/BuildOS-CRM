'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar } from 'lucide-react';

type Submittal = {
  id: string;
  submittalNumber: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  reviewStatus?: string;
  submittedDate: string;
  requiredOnSiteDate?: string;
  project: { name: string };
  submittedBy: { firstName: string; lastName: string };
};

export default function SubmittalsPage() {
  const [submittals, setSubmittals] = useState<Submittal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const url = statusFilter === 'all' ? '/api/submittals' : `/api/submittals?status=${statusFilter}`;
    fetch(url)
      .then((r) => r.ok && r.json())
      .then((d) => {
        setSubmittals(d?.submittals || []);
        setLoading(false);
      });
  }, [statusFilter]);

  const getStatusColor = (s: string) => ({
    ContractorReview: 'bg-blue-100 text-blue-700',
    SubmittedToArchitect: 'bg-yellow-100 text-yellow-700',
    ArchitectReview: 'bg-purple-100 text-purple-700',
    FinalApproval: 'bg-green-100 text-green-700',
    Closed: 'bg-gray-100 text-gray-700'
  }[s] || 'bg-gray-100 text-gray-700');

  const getPriorityColor = (p: string) => ({
    Low: 'bg-gray-100 text-gray-700',
    Normal: 'bg-blue-100 text-blue-700',
    High: 'bg-orange-100 text-orange-700',
    Critical: 'bg-red-100 text-red-700'
  }[p] || 'bg-gray-100 text-gray-700');

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Submittals</h1>
          <p className="text-gray-600 mt-1">Track and manage submittal approvals</p>
        </div>
        <Link href="/submittals/new">
          <Button className="bg-gradient-to-r from-blue-600 to-orange-500">
            <Plus className="w-4 h-4 mr-2" />
            New Submittal
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ContractorReview">Contractor Review</SelectItem>
            <SelectItem value="SubmittedToArchitect">Submitted to Architect</SelectItem>
            <SelectItem value="ArchitectReview">Architect Review</SelectItem>
            <SelectItem value="FinalApproval">Final Approval</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {submittals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No submittals found. Create your first submittal to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {submittals.map((sub) => (
            <Link key={sub.id} href={`/submittals/${sub.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{sub.submittalNumber}</CardTitle>
                        <Badge className={getPriorityColor(sub.priority)}>{sub.priority}</Badge>
                        <Badge className={getStatusColor(sub.status)}>
                          {sub.status.replace(/([A-Z])/g, ' $1').trim()}
                        </Badge>
                        {sub.reviewStatus && (
                          <Badge variant="outline">{sub.reviewStatus.replace(/([A-Z])/g, ' $1').trim()}</Badge>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{sub.title}</p>
                      <p className="text-sm text-gray-600 mt-1">Type: {sub.type.replace(/([A-Z])/g, ' $1').trim()}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Project</p>
                      <p className="font-medium">{sub.project.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Submitted By</p>
                      <p className="font-medium">{sub.submittedBy.firstName} {sub.submittedBy.lastName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Submitted Date</p>
                      <p className="font-medium flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(sub.submittedDate).toLocaleDateString()}
                      </p>
                    </div>
                    {sub.requiredOnSiteDate && (
                      <div>
                        <p className="text-gray-600">Required On-Site</p>
                        <p className="font-medium flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(sub.requiredOnSiteDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
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
