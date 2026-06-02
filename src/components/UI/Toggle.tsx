import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  description?: ReactNode;
}

export default function Toggle({ label, description, className, id, ...rest }: ToggleProps) {
  const inputId = id ?? `toggle-${String(label).replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <label htmlFor={inputId} className={cn('ds-toggle', className)}>
      <span className="min-w-0">
        <span className="block">{label}</span>
        {description ? (
          <span className="block text-[var(--font-size-sm)] text-[var(--color-text-muted)] mt-0.5">
            {description}
          </span>
        ) : null}
      </span>
      <input id={inputId} type="checkbox" className="ds-toggle__input" {...rest} />
    </label>
  );
}
