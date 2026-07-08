import * as React from 'react';

import { cn } from '../../utils/cn';

export function Separator({ className, ...props }: React.HTMLAttributes<HTMLHRElement>): JSX.Element {
  return <hr className={cn('border-border', className)} {...props} />;
}
