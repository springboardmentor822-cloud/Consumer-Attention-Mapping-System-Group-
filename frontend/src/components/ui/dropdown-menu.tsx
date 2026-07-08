import * as React from 'react';

import { cn } from '../../utils/cn';

export function DropdownMenu({ children }: { children: React.ReactNode }): JSX.Element {
  return <div className="relative inline-block text-left">{children}</div>;
}

export function DropdownMenuTrigger({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>): JSX.Element {
  return (
    <button className={cn('inline-flex items-center justify-center rounded-xl border border-border bg-background px-3 py-2 text-sm hover:bg-muted', className)} {...props}>
      {children}
    </button>
  );
}

export function DropdownMenuContent({ open, className, children }: { open: boolean; className?: string; children: React.ReactNode }): JSX.Element | null {
  if (!open) return null;
  return <div className={cn('absolute right-0 z-50 mt-2 min-w-44 rounded-xl border border-border bg-background p-1 shadow-soft', className)}>{children}</div>;
}

export function DropdownMenuItem({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }): JSX.Element {
  return (
    <button type="button" onClick={onClick} className={cn('flex w-full items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-muted', className)}>
      {children}
    </button>
  );
}
