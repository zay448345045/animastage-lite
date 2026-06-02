import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  raised?: boolean;
  children: ReactNode;
}

export default function Panel({ raised = false, className, children, ...rest }: PanelProps) {
  return (
    <div className={cn('ds-panel', raised && 'ds-panel--raised', className)} {...rest}>
      {children}
    </div>
  );
}
