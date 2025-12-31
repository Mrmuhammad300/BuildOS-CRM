'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface PunchItem {
  id: string;
  itemNumber: string;
  title: string;
  location: string;
  trade: string | null;
  status: string;
  priority: string;
  identifiedDate: string;
  dueDate: string | null;
  project: { name: string; projectNumber: string };
  identifiedBy: { firstName: string; lastName: string };
  assignedTo: { firstName: string; lastName: string } | null;
}

interface Project {
  id: string;
  name: string;
  projectNumber: string;
}

export default function PunchItemsPage() {
  const router = useRouter();
  const { data: session } = useSession() || {};
  const [punchItems, setPunchItems] = useState<PunchItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    project: '',
    status: '',
    trade: '',
  });

  useEffect(() => {
    fetchProjects();
    fetchPunchItems();
  }, [filters]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchPunchItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.project) params.append('project', filters.project);
      if (filters.status) params.append('status', filters.status);
      if (filters.trade) params.append('trade', filters.trade);

      const res = await fetch(`/api/punch-items?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPunchItems(data.punchItems || []);
      }
    } catch (error) {
      console.error('Failed to fetch punch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Open: 'bg-red-100 text-red-800',
      InProgress: 'bg-blue-100 text-blue-800',
      ReadyForReview: 'bg-yellow-100 text-yellow-800',
      Completed: 'bg-green-100 text-green-800',
      Verified: 'bg-purple-100 text-purple-800',
      Deferred: 'bg-gray-100 text-gray-800',
      Disputed: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      Low: 'bg-gray-100 text-gray-800',
      Normal: 'bg-blue-100 text-blue-800',
      High: 'bg-orange-100 text-orange-800',
      Critical: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status: string) => {
    return status.replace(/([A-Z])/g, ' $1').trim();
  };

  const statusCounts = {
    open: punchItems.filter(p => p.status === 'Open').length,
    inProgress: punchItems.filter(p => p.status === 'InProgress').length,
    completed: punchItems.filter(p => p.status === 'Completed').length,
    verified: punchItems.filter(p => p.status === 'Verified').length,
  };

  const uniqueTrades = Array.from(new Set(punchItems.map(p => p.trade).filter(Boolean)));

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Punch List</h1>
        <Button onClick={() => router.push('/punch-items/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Punch Item
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.open}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.inProgress}</div>
            <p className="text-xs text-muted-foreground">Being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.completed}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.verified}</div>
            <p className="text-xs text-muted-foreground">Work accepted</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Project</label>
              <Select
                value={filters.project || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, project: value === 'all' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.projectNumber} - {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="InProgress">In Progress</SelectItem>
                  <SelectItem value="ReadyForReview">Ready for Review</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Verified">Verified</SelectItem>
                  <SelectItem value="Deferred">Deferred</SelectItem>
                  <SelectItem value="Disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Trade</label>
              <Select
                value={filters.trade || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, trade: value === 'all' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All trades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All trades</SelectItem>
                  {uniqueTrades.map((trade) => (
                    <SelectItem key={trade} value={trade!}>
                      {trade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Punch Items List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading punch items...</p>
        </div>
      ) : punchItems.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">No punch items found</h3>
              <p className="text-muted-foreground mt-2">Get started by creating a new punch item.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {punchItems.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/punch-items/${item.id}`)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{item.itemNumber}</h3>
                      <Badge className={getStatusColor(item.status)}>
                        {formatStatus(item.status)}
                      </Badge>
                      <Badge className={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                      {item.trade && (
                        <Badge variant="outline">{item.trade}</Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">{item.title}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{item.project.projectNumber} - {item.project.name}</span>
                      <span>•</span>
                      <span>Location: {item.location}</span>
                      <span>•</span>
                      <span>By {item.identifiedBy.firstName} {item.identifiedBy.lastName}</span>
                      {item.assignedTo && (
                        <>
                          <span>•</span>
                          <span>Assigned to {item.assignedTo.firstName} {item.assignedTo.lastName}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-medium text-muted-foreground">Identified</div>
                    <div className="text-sm">{format(new Date(item.identifiedDate), 'MMM dd, yyyy')}</div>
                    {item.dueDate && (
                      <div className="mt-2">
                        <div className="text-sm font-medium text-muted-foreground">Due Date</div>
                        <div className="text-sm">{format(new Date(item.dueDate), 'MMM dd, yyyy')}</div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}