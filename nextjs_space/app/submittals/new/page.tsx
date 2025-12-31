'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  projectNumber: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function NewSubmittalPage() {
  const router = useRouter();
  const { data: session } = useSession() || {};
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [formData, setFormData] = useState({
    projectId: '',
    submittalNumber: '',
    title: '',
    description: '',
    type: 'ProductData',
    specSection: '',
    dueDate: '',
    priority: 'Normal',
    assignedToId: '',
    leadTimeDays: ''
  });

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

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

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        // Filter to Architect, Engineer, and Project Manager roles
        const reviewers = data.users.filter((u: User) => 
          ['Architect', 'Engineer', 'ProjectManager'].includes(u.role)
        );
        setUsers(reviewers);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId || !formData.title) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/submittals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
          leadTimeDays: formData.leadTimeDays ? parseInt(formData.leadTimeDays) : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Submittal created successfully');
        router.push(`/submittals/${data.submittal.id}`);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to create submittal');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create New Submittal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Selection */}
            <div className="space-y-2">
              <Label htmlFor="projectId">Project *</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.projectNumber} - {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>



            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter submittal title"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter detailed description"
                rows={4}
              />
            </div>

            {/* Type and Spec Section Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ProductData">Product Data</SelectItem>
                    <SelectItem value="ShopDrawings">Shop Drawings</SelectItem>
                    <SelectItem value="Samples">Samples</SelectItem>
                    <SelectItem value="MockUps">Mock-Ups</SelectItem>
                    <SelectItem value="Warranties">Warranties</SelectItem>
                    <SelectItem value="Certificates">Certificates</SelectItem>
                    <SelectItem value="TestReports">Test Reports</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specSection">Specification Section</Label>
                <Input
                  id="specSection"
                  value={formData.specSection}
                  onChange={(e) => setFormData(prev => ({ ...prev, specSection: e.target.value }))}
                  placeholder="e.g., 03 30 00"
                />
              </div>
            </div>

            {/* Due Date and Priority Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assigned To */}
            <div className="space-y-2">
              <Label htmlFor="assignedToId">Assign Reviewer</Label>
              <Select
                value={formData.assignedToId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, assignedToId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reviewer (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} - {user.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lead Time */}
            <div className="space-y-2">
              <Label htmlFor="leadTimeDays">Lead Time (Days)</Label>
              <Input
                id="leadTimeDays"
                type="number"
                value={formData.leadTimeDays}
                onChange={(e) => setFormData(prev => ({ ...prev, leadTimeDays: e.target.value }))}
                placeholder="e.g., 14"
                min="1"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Creating...' : 'Create Submittal'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}