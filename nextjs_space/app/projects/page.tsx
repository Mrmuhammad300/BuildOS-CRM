'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BackButton } from '@/components/ui/back-button';
import {
  Plus,
  Search,
  Filter,
  FolderKanban,
  DollarSign,
  Users,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

type Project = {
  id: string;
  name: string;
  client: string;
  projectNumber: string;
  address: string;
  startDate: string;
  estimatedCompletion: string;
  budget: number;
  status: string;
  phase: string;
  _count?: {
    rfis: number;
    dailyReports: number;
    documents: number;
  };
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [phaseFilter, setPhaseFilter] = useState('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, statusFilter, phaseFilter]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data?.projects ?? []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];

    if (searchTerm) {
      filtered = filtered?.filter(
        (p) =>
          p?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ??
          p?.client?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ??
          p?.projectNumber?.toLowerCase()?.includes(searchTerm?.toLowerCase())
      ) ?? [];
    }

    if (statusFilter !== 'all') {
      filtered = filtered?.filter((p) => p?.status === statusFilter) ?? [];
    }

    if (phaseFilter !== 'all') {
      filtered = filtered?.filter((p) => p?.phase === phaseFilter) ?? [];
    }

    setFilteredProjects(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-700';
      case 'PreConstruction':
        return 'bg-blue-100 text-blue-700';
      case 'OnHold':
        return 'bg-yellow-100 text-yellow-700';
      case 'Completed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPhaseColor = (phase: string) => {
    const colors: { [key: string]: string } = {
      Planning: 'bg-slate-100 text-slate-700',
      Foundation: 'bg-blue-100 text-blue-700',
      Framing: 'bg-orange-100 text-orange-700',
      MEP: 'bg-purple-100 text-purple-700',
      Finishing: 'bg-green-100 text-green-700',
      Closeout: 'bg-gray-100 text-gray-700',
    };
    return colors?.[phase] ?? 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BackButton />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects</h1>
          <p className="text-gray-600">Manage all construction projects</p>
        </div>
        <Link href="/projects/new">
          <Button className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </Link>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PreConstruction">Pre-Construction</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="OnHold">On Hold</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Phases</SelectItem>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Foundation">Foundation</SelectItem>
                  <SelectItem value="Framing">Framing</SelectItem>
                  <SelectItem value="MEP">MEP</SelectItem>
                  <SelectItem value="Finishing">Finishing</SelectItem>
                  <SelectItem value="Closeout">Closeout</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading projects...</div>
      ) : filteredProjects?.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <FolderKanban className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all' || phaseFilter !== 'all'
              ? 'No projects match your filters'
              : 'No projects yet'}
          </p>
          {!searchTerm && statusFilter === 'all' && phaseFilter === 'all' && (
            <Link href="/projects/new">
              <Button>Create your first project</Button>
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects?.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/projects/${project.id}`}>
                <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-600 group cursor-pointer">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <CardTitle className="text-xl group-hover:text-blue-600 transition-colors mb-2">
                          {project.name}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className={getStatusColor(project.status)}>
                            {project.status === 'PreConstruction' ? 'Pre-Construction' : project.status === 'OnHold' ? 'On Hold' : project.status}
                          </Badge>
                          <Badge variant="outline" className={getPhaseColor(project.phase)}>
                            {project.phase}
                          </Badge>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        <span className="font-medium">Client:</span>
                        <span className="ml-1">{project.client}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FolderKanban className="w-4 h-4 mr-2" />
                        <span className="font-medium">Project #:</span>
                        <span className="ml-1">{project.projectNumber}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span className="font-medium">Budget:</span>
                        <span className="ml-1">${(project.budget / 1000000).toFixed(2)}M</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className="font-medium">Duration:</span>
                        <span className="ml-1">
                          {new Date(project.startDate).toLocaleDateString()} - {new Date(project.estimatedCompletion).toLocaleDateString()}
                        </span>
                      </div>
                      {project._count && (
                        <div className="flex gap-4 pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-600">
                            <span className="font-semibold text-blue-600">{project._count.rfis}</span> RFIs
                          </div>
                          <div className="text-xs text-gray-600">
                            <span className="font-semibold text-green-600">{project._count.dailyReports}</span> Reports
                          </div>
                          <div className="text-xs text-gray-600">
                            <span className="font-semibold text-purple-600">{project._count.documents}</span> Documents
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
