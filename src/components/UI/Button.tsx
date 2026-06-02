import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  active = false,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'ds-btn',
        size === 'sm' && 'ds-btn--sm',
        `ds-btn--${variant}`,
        active && 'ds-btn--active',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
