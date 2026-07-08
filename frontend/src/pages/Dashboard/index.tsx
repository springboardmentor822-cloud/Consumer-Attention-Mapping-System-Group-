import * as React from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { StoreManagerDashboard } from './components/StoreManagerDashboard';
import { AnalystDashboard } from './components/AnalystDashboard';

export function DashboardPage(): JSX.Element {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.role) {
      case 'SuperAdmin':
        return <SuperAdminDashboard />;
      case 'StoreManager':
        return <StoreManagerDashboard />;
      case 'Analyst':
        return <AnalystDashboard />;
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[300px] border border-dashed rounded-2xl p-6">
            <p className="text-muted-foreground font-medium">Resolving console access privileges...</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.email ?? 'team member'}`}
        description="Comprehensive overview of your store intelligence, shelf performance, and monitoring systems."
      />
      {renderDashboard()}
    </div>
  );
}
