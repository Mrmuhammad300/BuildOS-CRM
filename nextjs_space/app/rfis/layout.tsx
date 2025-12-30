import { DashboardNav } from '@/components/dashboard-nav';

export default function RFIsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-orange-50/50">
      <DashboardNav />
      <main>{children}</main>
    </div>
  );
}
