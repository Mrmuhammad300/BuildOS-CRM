'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, FileStack, Download, Upload, Loader2 } from 'lucide-react';

type Document = {
  id: string;
  filename: string;
  category: string;
  discipline: string;
  cloudStoragePath: string;
  isPublic: boolean;
  project: { name: string };
  uploadedBy: { firstName: string; lastName: string };
  createdAt: string;
};

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [filtered, setFiltered] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [uploadData, setUploadData] = useState({ projectId: '', category: 'Other', discipline: 'General', file: null as File | null });

  useEffect(() => {
    Promise.all([fetch('/api/documents'), fetch('/api/projects')]).then(async ([d, p]) => {
      if (d.ok) setDocs((await d.json())?.documents ?? []);
      if (p.ok) setProjects((await p.json())?.projects ?? []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let f = [...docs];
    if (search) f = f?.filter(d => d?.filename?.toLowerCase()?.includes(search?.toLowerCase())) ?? [];
    if (categoryFilter !== 'all') f = f?.filter(d => d?.category === categoryFilter) ?? [];
    setFiltered(f);
  }, [docs, search, categoryFilter]);

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.projectId) return;
    setUploading(true);

    try {
      // Get presigned URL
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: uploadData.file.name, contentType: uploadData.file.type, isPublic: false })
      });
      const { uploadUrl, cloud_storage_path } = await presignedRes.json();

      // Upload to S3
      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': uploadData.file.type }, body: uploadData.file });

      // Save to database
      await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: uploadData.projectId,
          filename: uploadData.file.name,
          category: uploadData.category,
          discipline: uploadData.discipline,
          cloudStoragePath: cloud_storage_path,
          isPublic: false
        })
      });

      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('Upload failed');
      setUploading(false);
    }
  };

  const getCategoryColor = (c: string) => ({
    Contracts: 'bg-purple-100 text-purple-700',
    Drawings: 'bg-blue-100 text-blue-700',
    Specifications: 'bg-green-100 text-green-700',
    Photos: 'bg-pink-100 text-pink-700',
    Reports: 'bg-orange-100 text-orange-700',
    Other: 'bg-gray-100 text-gray-700'
  }[c] ?? 'bg-gray-100 text-gray-700');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <BackButton />
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-3xl font-bold mb-2">Documents</h1><p className="text-gray-600">Project documentation and files</p></div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-to-r from-blue-600 to-orange-500"><Plus className="w-4 h-4 mr-2" />Upload Document</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Project *</Label><Select value={uploadData.projectId} onValueChange={(v) => setUploadData({ ...uploadData, projectId: v })} disabled={uploading}><SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger><SelectContent>{projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Category</Label><Select value={uploadData.category} onValueChange={(v) => setUploadData({ ...uploadData, category: v })} disabled={uploading}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Contracts">Contracts</SelectItem><SelectItem value="Drawings">Drawings</SelectItem><SelectItem value="Specifications">Specifications</SelectItem><SelectItem value="Photos">Photos</SelectItem><SelectItem value="Reports">Reports</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Discipline</Label><Select value={uploadData.discipline} onValueChange={(v) => setUploadData({ ...uploadData, discipline: v })} disabled={uploading}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Architectural">Architectural</SelectItem><SelectItem value="Structural">Structural</SelectItem><SelectItem value="MEP">MEP</SelectItem><SelectItem value="Civil">Civil</SelectItem><SelectItem value="General">General</SelectItem></SelectContent></Select></div>
              </div>
              <div className="space-y-2"><Label>File *</Label><Input type="file" onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] ?? null })} disabled={uploading} /></div>
              <Button onClick={handleUpload} disabled={uploading || !uploadData.file || !uploadData.projectId} className="w-full">{uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : <><Upload className="mr-2 h-4 w-4" />Upload</>}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem><SelectItem value="Contracts">Contracts</SelectItem><SelectItem value="Drawings">Drawings</SelectItem><SelectItem value="Specifications">Specifications</SelectItem><SelectItem value="Photos">Photos</SelectItem><SelectItem value="Reports">Reports</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select>
          </div>
        </CardContent>
      </Card>

      {loading ? <div className="text-center py-12">Loading...</div> : filtered?.length === 0 ? <div className="text-center py-12"><FileStack className="w-16 h-16 text-gray-400 mx-auto mb-4" /><p className="text-gray-600 mb-4">{search || categoryFilter !== 'all' ? 'No documents match your filters' : 'No documents yet'}</p>{!search && categoryFilter === 'all' && <Button onClick={() => setUploadOpen(true)}>Upload your first document</Button>}</div> : (
        <div className="space-y-3">
          {filtered?.map(doc => (
            <Card key={doc.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><FileStack className="w-6 h-6 text-blue-600" /></div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{doc.filename}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <Badge className={getCategoryColor(doc.category)}>{doc.category}</Badge>
                        <Badge variant="outline">{doc.discipline}</Badge>
                        <span>•</span>
                        <span>{doc.project?.name}</span>
                        <span>•</span>
                        <span>Uploaded by {doc.uploadedBy?.firstName} {doc.uploadedBy?.lastName}</span>
                        <span>•</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `/api/documents/${doc.id}/download`;
                      link.target = '_blank';
                      link.click();
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
