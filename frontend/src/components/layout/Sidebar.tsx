import {
  Camera,
  LayoutDashboard,
  Store,
  ShoppingBag,
  UserRound,
  X,
  Users,
  FileText,
  ClipboardList,
  Settings,
  Bell,
  BarChart3,
  Map,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { Button } from '../ui/button';
import { cn } from '../../utils/cn';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed?: boolean;
}

export function Sidebar({ open, onClose }: SidebarProps): JSX.Element {
  const { user } = useAuth();
  const role = user?.role;

  let links = [];
  if (role === 'SuperAdmin') {
    links = [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/users', label: 'Users', icon: Users },
      { to: '/stores', label: 'Stores', icon: Store },
      { to: '/shelves', label: 'Shelves', icon: ShoppingBag },
      { to: '/cameras', label: 'Cameras', icon: Camera },
      { to: '/reports', label: 'Reports', icon: FileText },
      { to: '/audit-logs', label: 'Audit Logs', icon: ClipboardList },
      { to: '/settings', label: 'Settings', icon: Settings },
    ];
  } else if (role === 'StoreManager') {
    links = [
      { to: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/stores', label: 'Store', icon: Store },
      { to: '/shelves', label: 'Shelves', icon: ShoppingBag },
      { to: '/cameras', label: 'Cameras', icon: Camera },
      { to: '/reports', label: 'Reports', icon: FileText },
      { to: '/alerts', label: 'Alerts', icon: Bell },
      { to: '/profile', label: 'Profile', icon: UserRound },
    ];
  } else if (role === 'Analyst') {
    links = [
      { to: '/analyst/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/heatmaps', label: 'Heatmaps', icon: Map },
      { to: '/reports', label: 'Reports', icon: FileText },
      { to: '/profile', label: 'Profile', icon: UserRound },
    ];
  } else {
    links = [
      { to: '/analyst/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/profile', label: 'Profile', icon: UserRound },
    ];
  }

  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 border-r border-border bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(15,23,42,0.92))] text-white transition-transform lg:static lg:translate-x-0 lg:bg-slate-950',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Consumer Attention</p>
            <h2 className="text-lg font-semibold">Mapping System</h2>
          </div>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors hover:bg-white/10',
                    isActive ? 'bg-emerald-500/15 text-emerald-200' : 'text-white/80',
                  )
                }
                onClick={onClose}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-white/10 p-4 text-xs text-white/60">
          <p>{role ?? 'Guest'} access</p>
          <p className="mt-1">Enterprise Analytics Console</p>
        </div>
      </aside>
      {open ? <button type="button" className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden" onClick={onClose} aria-label="Close sidebar overlay" /> : null}
    </>
  );
}
