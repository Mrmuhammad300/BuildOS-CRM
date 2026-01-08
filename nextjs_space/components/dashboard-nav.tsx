'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  HardHat,
  LayoutDashboard,
  FolderKanban,
  Building2,
  MessageSquare,
  FileText,
  FileStack,
  ClipboardCheck,
  DollarSign,
  CheckCircle,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Properties', href: '/properties', icon: Building2 },
  { name: 'RFIs', href: '/rfis', icon: MessageSquare },
  { name: 'Submittals', href: '/submittals', icon: ClipboardCheck },
  { name: 'Daily Reports', href: '/daily-reports', icon: FileText },
  { name: 'Documents', href: '/documents', icon: FileStack },
  { name: 'Change Orders', href: '/change-orders', icon: DollarSign },
  { name: 'Punch List', href: '/punch-items', icon: CheckCircle },
];

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession() || {};
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/login');
  };

  const userInitials = session?.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() ?? 'U';

  const userRole = (session?.user as any)?.role ?? 'User';

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-orange-500 rounded-lg flex items-center justify-center group-hover:shadow-lg transition-shadow">
              <HardHat className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                Construction CRM
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`flex items-center space-x-2 ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-orange-500 text-white text-sm font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:block text-sm font-medium">{session?.user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
                    <p className="text-xs leading-none text-blue-600 mt-1">{userRole}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link key={item.name} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start flex items-center space-x-3 ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
