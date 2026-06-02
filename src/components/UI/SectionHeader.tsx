import type { ReactNode } from 'react';
import { cn } from './cn';

export interface SectionHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  accent?: 'primary' | 'accent' | 'warning';
}

const accentClass: Record<NonNullable<SectionHeaderProps['accent']>, string> = {
  primary: 'text-[var(--color-primary)]',
  accent: 'text-[var(--color-accent)]',
  warning: 'text-[var(--color-warning)]',
};

export default function SectionHeader({
  title,
  description,
  action,
  className,
  accent = 'primary',
}: SectionHeaderProps) {
  return (
    <div className={cn('ds-section-header', className)}>
      <div className="min-w-0">
        <h3 className={cn('ds-section-header__title', accentClass[accent])}>{title}</h3>
        {description ? <p className="ds-section-header__desc">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
