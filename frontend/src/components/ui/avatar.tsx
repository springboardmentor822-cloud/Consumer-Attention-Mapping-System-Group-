import * as React from 'react';

import { cn } from '../../utils/cn';

export function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return <div className={cn('flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary', className)} {...props} />;
}
