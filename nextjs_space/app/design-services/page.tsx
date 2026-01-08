'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/ui/back-button';
import { Plus, Search, FileText, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  Draft: 'bg-gray-500',
  Submitted: 'bg-blue-500',
  AIProcessing: 'bg-purple-500',
  UnderReview: 'bg-yellow-500',
  ClientReview: 'bg-orange-500',
  RevisionRequired: 'bg-red-500',
  Approved: 'bg-green-500',
  InDesign: 'bg-indigo-500',
  Rendering: 'bg-cyan-500',
  Completed: 'bg-emerald-500',
  Cancelled: 'bg-gray-400',
};

const statusIcons: Record<string, any> = {
  Draft: FileText,
  Submitted: Clock,
  AIProcessing: AlertCircle,
  UnderReview: AlertCircle,
  ClientReview: Clock,
  RevisionRequired: XCircle,
  Approved: CheckCircle2,
  InDesign: Clock,
  Rendering: Clock,
  Completed: CheckCircle2,
  Cancelled: XCircle,
};

export default function DesignServicesPage() {
  const router = useRouter();
  const [designRequests, setDesignRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectTypeFilter, setProjectTypeFilter] = useState('all');

  useEffect(() => {
    fetchDesignRequests();
  }, [statusFilter, projectTypeFilter]);

  const fetchDesignRequests = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (projectTypeFilter !== 'all') params.append('projectType', projectTypeFilter);

      const response = await fetch(`/api/design-requests?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDesignRequests(data);
      }
    } catch (error) {
      console.error('Error fetching design requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = designRequests.filter(req =>
    req.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.requestNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate summary statistics
  const stats = {
    total: designRequests.length,
    inProgress: designRequests.filter(r => ['Submitted', 'AIProcessing', 'UnderReview', 'Rendering', 'InDesign'].includes(r.status)).length,
    completed: designRequests.filter(r => r.status === 'Completed').length,
    needsAttention: designRequests.filter(r => ['RevisionRequired', 'ClientReview'].includes(r.status)).length,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <BackButton fallbackUrl="/dashboard" />
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Design Services</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered architectural design requests and rendering services
          </p>
        </div>
        <Link href="/design-services/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Needs Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.needsAttention}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by project name, client, or request number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Submitted">Submitted</SelectItem>
            <SelectItem value="AIProcessing">AI Processing</SelectItem>
            <SelectItem value="UnderReview">Under Review</SelectItem>
            <SelectItem value="ClientReview">Client Review</SelectItem>
            <SelectItem value="RevisionRequired">Revision Required</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="InDesign">In Design</SelectItem>
            <SelectItem value="Rendering">Rendering</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={projectTypeFilter} onValueChange={setProjectTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by project type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Residential">Residential</SelectItem>
            <SelectItem value="Commercial">Commercial</SelectItem>
            <SelectItem value="Industrial">Industrial</SelectItem>
            <SelectItem value="MixedUse">Mixed-Use</SelectItem>
            <SelectItem value="Renovation">Renovation</SelectItem>
            <SelectItem value="LandscapingInterior">Landscaping/Interior</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Design Requests List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading design requests...</div>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">No design requests found</p>
            <Link href="/design-services/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Request
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const StatusIcon = statusIcons[request.status] || FileText;
            return (
              <Card
                key={request.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/design-services/${request.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{request.projectName}</h3>
                        <Badge className={`${statusColors[request.status]} text-white`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {request.status}
                        </Badge>
                        <Badge variant="outline">{request.projectType}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Request #:</span> {request.requestNumber}
                        </div>
                        <div>
                          <span className="font-medium">Client:</span> {request.clientName}
                        </div>
                        <div>
                          <span className="font-medium">Timeline:</span> {request.timeline}
                        </div>
                        <div>
                          <span className="font-medium">Tasks:</span> {request.tasks?.length || 0}
                        </div>
                      </div>

                      {request.project && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <span className="font-medium">Linked Project:</span> {request.project.name} ({request.project.projectNumber})
                        </div>
                      )}

                      <div className="mt-2 text-sm text-muted-foreground">
                        <span className="font-medium">Created:</span> {format(new Date(request.createdAt), 'PPP')}
                        {request.submittedAt && (
                          <span className="ml-4">
                            <span className="font-medium">Submitted:</span> {format(new Date(request.submittedAt), 'PPP')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
