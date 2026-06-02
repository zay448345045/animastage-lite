import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from './cn';

export interface CollapsibleSectionProps {
  title: ReactNode;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  badge?: ReactNode;
}

export default function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  children,
  className,
  badge,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={cn('border-b border-[var(--color-border)] last:border-b-0', className)}
      style={{ padding: 'var(--space-md) 0' }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-[var(--space-sm)] text-left cursor-pointer group"
        aria-expanded={open}
      >
        {icon ? (
          <span className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors">
            {icon}
          </span>
        ) : null}
        <span
          className="flex-1 text-[var(--font-size-base)] font-semibold text-[var(--color-text-main)] tracking-tight"
        >
          {title}
        </span>
        {badge}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-[var(--color-text-muted)] transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      {open ? (
        <div className="mt-[var(--space-md)] ds-stack ds-stack--sm">{children}</div>
      ) : null}
    </section>
  );
}
