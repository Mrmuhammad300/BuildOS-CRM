'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { BackButton } from '@/components/ui/back-button';
import { Loader2 } from 'lucide-react';

export default function NewDesignRequestPage() {
  const router = useRouter();
  const { data: session } = useSession() || {};
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    projectName: '',
    projectType: 'Residential',
    description: '',
    requirements: '',
    siteDetails: '',
    budget: '',
    timeline: 'Standard',
    projectId: 'none',
  });

  useEffect(() => {
    // Fetch projects for dropdown
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(Array.isArray(data) ? data : []);
        } else {
          setProjects([]);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    // Auto-fill client info from session if available
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        clientName: session.user?.name || '',
        clientEmail: session.user?.email || '',
      }));
    }

    fetchProjects();
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/design-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          projectId: formData.projectId === 'none' ? null : formData.projectId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create design request');
      }

      const designRequest = await response.json();
      toast.success('Design request created successfully');
      router.push(`/design-services/${designRequest.id}`);
    } catch (error: any) {
      console.error('Error creating design request:', error);
      toast.error(error.message || 'Failed to create design request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <BackButton fallbackUrl="/design-services" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Architectural Design Request</CardTitle>
          <CardDescription>
            Submit your architectural design requirements. Our AI-powered platform will analyze your needs and connect you with design services.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Client Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="clientEmail">Client Email *</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="clientPhone">Client Phone</Label>
                <Input
                  id="clientPhone"
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                />
              </div>
            </div>

            {/* Project Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Project Details</h3>

              <div>
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  required
                  placeholder="e.g., Downtown Commercial Plaza"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="projectType">Project Type *</Label>
                  <Select
                    value={formData.projectType}
                    onValueChange={(value) => setFormData({ ...formData, projectType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Residential">Residential</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Industrial">Industrial</SelectItem>
                      <SelectItem value="MixedUse">Mixed-Use</SelectItem>
                      <SelectItem value="Renovation">Renovation</SelectItem>
                      <SelectItem value="LandscapingInterior">Landscaping/Interior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="timeline">Timeline *</Label>
                  <Select
                    value={formData.timeline}
                    onValueChange={(value) => setFormData({ ...formData, timeline: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rush">Rush (1-2 weeks)</SelectItem>
                      <SelectItem value="Standard">Standard (3-4 weeks)</SelectItem>
                      <SelectItem value="Flexible">Flexible (1-2 months)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Budget (USD)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="e.g., 500000"
                  />
                </div>

                <div>
                  <Label htmlFor="projectId">Link to Existing Project</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Project</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name} ({project.projectNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Project Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                  placeholder="Brief overview of the project..."
                />
              </div>

              <div>
                <Label htmlFor="requirements">Design Requirements *</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  required
                  rows={5}
                  placeholder="Describe your design vision, style preferences, functional needs, special features, etc."
                />
              </div>

              <div>
                <Label htmlFor="siteDetails">Site Details</Label>
                <Textarea
                  id="siteDetails"
                  value={formData.siteDetails}
                  onChange={(e) => setFormData({ ...formData, siteDetails: e.target.value })}
                  rows={3}
                  placeholder="Location, dimensions, topography, constraints, existing structures, utilities, etc."
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/design-services')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Design Request'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
