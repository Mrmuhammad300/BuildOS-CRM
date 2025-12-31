'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, DollarSign, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface ChangeOrder {
  id: string;
  changeOrderNumber: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  proposedCost: number;
  approvedCost: number | null;
  actualCost: number | null;
  scheduleImpact: number | null;
  requestedDate: string;
  project: { name: string; projectNumber: string };
  requestedBy: { firstName: string; lastName: string };
}

interface Project {
  id: string;
  name: string;
  projectNumber: string;
}

export default function ChangeOrdersPage() {
  const router = useRouter();
  const { data: session } = useSession() || {};
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    project: '',
    status: '',
  });

  useEffect(() => {
    fetchProjects();
    fetchChangeOrders();
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

  const fetchChangeOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.project) params.append('project', filters.project);
      if (filters.status) params.append('status', filters.status);

      const res = await fetch(`/api/change-orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setChangeOrders(data.changeOrders || []);
      }
    } catch (error) {
      console.error('Failed to fetch change orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Draft: 'bg-gray-100 text-gray-800',
      Submitted: 'bg-blue-100 text-blue-800',
      UnderReview: 'bg-yellow-100 text-yellow-800',
      Approved: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      OnHold: 'bg-orange-100 text-orange-800',
      Implemented: 'bg-purple-100 text-purple-800',
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

  const totalProposed = changeOrders.reduce((sum, co) => sum + co.proposedCost, 0);
  const totalApproved = changeOrders.reduce((sum, co) => sum + (co.approvedCost || 0), 0);
  const totalActual = changeOrders.reduce((sum, co) => sum + (co.actualCost || 0), 0);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Change Orders</h1>
        <Button onClick={() => router.push('/change-orders/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Change Order
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proposed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalProposed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {changeOrders.length} change order(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Approved</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalApproved.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {changeOrders.filter(co => co.approvedCost).length} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actual</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalActual.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {changeOrders.filter(co => co.actualCost).length} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="UnderReview">Under Review</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="OnHold">On Hold</SelectItem>
                  <SelectItem value="Implemented">Implemented</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Orders List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading change orders...</p>
        </div>
      ) : changeOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">No change orders found</h3>
              <p className="text-muted-foreground mt-2">Get started by creating a new change order.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {changeOrders.map((co) => (
            <Card
              key={co.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/change-orders/${co.id}`)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{co.changeOrderNumber}</h3>
                      <Badge className={getStatusColor(co.status)}>
                        {formatStatus(co.status)}
                      </Badge>
                      <Badge className={getPriorityColor(co.priority)}>
                        {co.priority}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">{co.title}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{co.project.projectNumber} - {co.project.name}</span>
                      <span>•</span>
                      <span>{formatStatus(co.type)}</span>
                      <span>•</span>
                      <span>Requested by {co.requestedBy.firstName} {co.requestedBy.lastName}</span>
                      <span>•</span>
                      <span>{format(new Date(co.requestedDate), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-medium text-muted-foreground">Proposed</div>
                    <div className="text-xl font-bold">${co.proposedCost.toLocaleString()}</div>
                    {co.approvedCost && (
                      <div className="mt-2">
                        <div className="text-sm font-medium text-muted-foreground">Approved</div>
                        <div className="text-lg font-semibold text-green-600">
                          ${co.approvedCost.toLocaleString()}
                        </div>
                      </div>
                    )}
                    {co.scheduleImpact && (
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Schedule: </span>
                        <span className={co.scheduleImpact > 0 ? 'text-red-600' : 'text-green-600'}>
                          {co.scheduleImpact > 0 ? '+' : ''}{co.scheduleImpact} days
                        </span>
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