import * as React from 'react';

import { cn } from '../../utils/cn';

type BadgeVariant = 'default' | 'secondary' | 'outline';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'border-transparent bg-primary text-primary-foreground',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  outline: 'border-border bg-transparent text-foreground',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps): JSX.Element {
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', variantClasses[variant], className)} {...props} />;
}
