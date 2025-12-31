'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User, Cloud, Users, Wrench, Package, AlertTriangle, CheckCircle } from 'lucide-react';

type Report = {
  id: string;
  date: string;
  project: { name: string; projectNumber: string };
  submittedBy: { firstName: string; lastName: string; role: string };
  weatherCondition?: string;
  temperatureHigh?: number;
  temperatureLow?: number;
  precipitation?: number;
  windSpeed?: number;
  contractorWorkers?: number;
  subcontractorWorkers?: number;
  tradesOnSite?: string[];
  workPerformed?: string;
  equipmentOnSite?: string[];
  materialsDelivered?: string[];
  incidentsCount?: number;
  nearMissesCount?: number;
  safetyViolations?: string[];
  ppeComplianceStatus?: string;
  issuesAndDelays?: string;
  inspectionsConducted?: string[];
};

export default function DailyReportDetailPage() {
  const params = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) fetch(`/api/daily-reports/${params.id}`).then(r => r.ok && r.json()).then(d => { setReport(d?.report); setLoading(false); });
  }, [params?.id]);

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8 text-center">Loading...</div>;
  if (!report) return <div className="max-w-7xl mx-auto px-4 py-8 text-center">Report not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <BackButton fallbackUrl="/daily-reports" />
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{report.project?.name}</h1>
          <p className="text-gray-600">{report.project?.projectNumber}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center text-lg font-semibold"><Calendar className="w-5 h-5 mr-2" />{new Date(report.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <p className="text-sm text-gray-600 mt-1">Submitted by {report.submittedBy?.firstName} {report.submittedBy?.lastName}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {(report.weatherCondition || report.temperatureHigh || report.temperatureLow) && (
          <Card>
            <CardHeader><CardTitle className="flex items-center"><Cloud className="w-5 h-5 mr-2" />Weather</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {report.weatherCondition && <div><span className="text-sm text-gray-600">Condition: </span><span className="font-medium">{report.weatherCondition}</span></div>}
              {report.temperatureHigh && <div><span className="text-sm text-gray-600">High: </span><span className="font-medium">{report.temperatureHigh}°F</span></div>}
              {report.temperatureLow && <div><span className="text-sm text-gray-600">Low: </span><span className="font-medium">{report.temperatureLow}°F</span></div>}
              {report.precipitation && <div><span className="text-sm text-gray-600">Precipitation: </span><span className="font-medium">{report.precipitation}in</span></div>}
              {report.windSpeed && <div><span className="text-sm text-gray-600">Wind: </span><span className="font-medium">{report.windSpeed}mph</span></div>}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="flex items-center"><Users className="w-5 h-5 mr-2" />Workforce</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div><span className="text-sm text-gray-600">Contractor Workers: </span><span className="font-medium">{report.contractorWorkers ?? 0}</span></div>
            <div><span className="text-sm text-gray-600">Subcontractor Workers: </span><span className="font-medium">{report.subcontractorWorkers ?? 0}</span></div>
            <div><span className="text-sm text-gray-600">Total: </span><span className="font-semibold text-lg">{(report.contractorWorkers ?? 0) + (report.subcontractorWorkers ?? 0)}</span></div>
            {report.tradesOnSite && report.tradesOnSite.length > 0 && <div className="pt-2 mt-2 border-t"><p className="text-sm text-gray-600 mb-2">Trades On Site:</p><div className="flex flex-wrap gap-2">{report.tradesOnSite.map((trade, i) => <Badge key={i} variant="outline">{trade}</Badge>)}</div></div>}
          </CardContent>
        </Card>
      </div>

      {report.workPerformed && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Work Performed</CardTitle></CardHeader>
          <CardContent><p className="text-gray-700 whitespace-pre-wrap">{report.workPerformed}</p></CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        {report.equipmentOnSite && report.equipmentOnSite.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center"><Wrench className="w-5 h-5 mr-2" />Equipment On Site</CardTitle></CardHeader>
            <CardContent><ul className="space-y-1">{report.equipmentOnSite.map((eq, i) => <li key={i} className="text-gray-700">• {eq}</li>)}</ul></CardContent>
          </Card>
        )}

        {report.materialsDelivered && report.materialsDelivered.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center"><Package className="w-5 h-5 mr-2" />Materials Delivered</CardTitle></CardHeader>
            <CardContent><ul className="space-y-1">{report.materialsDelivered.map((mat, i) => <li key={i} className="text-gray-700">• {mat}</li>)}</ul></CardContent>
          </Card>
        )}
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="flex items-center"><AlertTriangle className="w-5 h-5 mr-2" />Safety</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div><span className="text-sm text-gray-600">Incidents: </span><span className={`font-semibold ${(report.incidentsCount ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>{report.incidentsCount ?? 0}</span></div>
            <div><span className="text-sm text-gray-600">Near Misses: </span><span className={`font-semibold ${(report.nearMissesCount ?? 0) > 0 ? 'text-orange-600' : 'text-green-600'}`}>{report.nearMissesCount ?? 0}</span></div>
          </div>
          {report.ppeComplianceStatus && <div><span className="text-sm text-gray-600">PPE Compliance: </span><span className="font-medium">{report.ppeComplianceStatus}</span></div>}
          {report.safetyViolations && report.safetyViolations.length > 0 && <div className="pt-2 mt-2 border-t"><p className="text-sm text-gray-600 mb-2">Safety Violations:</p><ul className="space-y-1">{report.safetyViolations.map((v, i) => <li key={i} className="text-red-700">• {v}</li>)}</ul></div>}
        </CardContent>
      </Card>

      {report.issuesAndDelays && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Issues & Delays</CardTitle></CardHeader>
          <CardContent><p className="text-gray-700 whitespace-pre-wrap">{report.issuesAndDelays}</p></CardContent>
        </Card>
      )}

      {report.inspectionsConducted && report.inspectionsConducted.length > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle className="flex items-center"><CheckCircle className="w-5 h-5 mr-2" />Inspections Conducted</CardTitle></CardHeader>
          <CardContent><ul className="space-y-1">{report.inspectionsConducted.map((insp, i) => <li key={i} className="text-gray-700">• {insp}</li>)}</ul></CardContent>
        </Card>
      )}
    </div>
  );
}
