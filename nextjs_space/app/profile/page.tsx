'use client';

import { useSession } from 'next-auth/react';
import { DashboardNav } from '@/components/dashboard-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, Briefcase } from 'lucide-react';

export default function ProfilePage() {
  const { data: session } = useSession() || {};
  const userRole = (session?.user as any)?.role ?? 'User';
  const userInitials = session?.user?.name?.split(' ')?.map(n => n?.[0])?.join('')?.toUpperCase() ?? 'U';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-orange-50/50">
      <DashboardNav />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6 mb-6">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-orange-500 text-white text-2xl">{userInitials}</AvatarFallback>
              </Avatar>
              <div><h2 className="text-2xl font-bold">{session?.user?.name}</h2><Badge className="mt-2">{userRole}</Badge></div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3"><User className="w-5 h-5 text-gray-500" /><div><p className="text-sm text-gray-600">Full Name</p><p className="font-medium">{session?.user?.name}</p></div></div>
              <div className="flex items-center space-x-3"><Mail className="w-5 h-5 text-gray-500" /><div><p className="text-sm text-gray-600">Email</p><p className="font-medium">{session?.user?.email}</p></div></div>
              <div className="flex items-center space-x-3"><Briefcase className="w-5 h-5 text-gray-500" /><div><p className="text-sm text-gray-600">Role</p><p className="font-medium">{userRole}</p></div></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
