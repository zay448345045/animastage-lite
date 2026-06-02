import type { SelectHTMLAttributes } from 'react';
import { cn } from './cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

export default function Select({ className, children, ...rest }: SelectProps) {
  return (
    <select className={cn('ds-select', className)} {...rest}>
      {children}
    </select>
  );
}
