import { Menu, MoonStar, Search, SunMedium } from 'lucide-react';
import * as React from 'react';

import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Avatar } from '../ui/avatar';
import { Input } from '../ui/input';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';

interface TopbarProps {
  onToggleSidebar: () => void;
}

export function Topbar({ onToggleSidebar }: TopbarProps): JSX.Element {
  const { user, logout } = useAuth();
  const [theme, toggleTheme] = useTheme();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <Button variant="ghost" size="sm" className="lg:hidden" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <Menu className="h-5 w-5" />
        </Button>

        <div className="relative hidden flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search stores, shelves, cameras..." />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle dark mode">
            {theme === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger onClick={() => setMenuOpen((current) => !current)}>
              <span className="flex items-center gap-2">
                <Avatar>{user?.email?.slice(0, 1).toUpperCase()}</Avatar>
                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-medium">{user?.email}</span>
                  <span className="block text-xs text-muted-foreground">{user?.role}</span>
                </span>
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent open={menuOpen}>
              <DropdownMenuItem onClick={() => {
                setMenuOpen(false);
                window.location.href = '/profile';
              }}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setMenuOpen(false);
                logout();
              }}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
