import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  valueLabel?: ReactNode;
}

export default function Slider({ label, valueLabel, className, ...rest }: SliderProps) {
  return (
    <div className={cn('ds-slider', className)}>
      {(label != null || valueLabel != null) && (
        <div className="ds-slider__label">
          <span>{label}</span>
          {valueLabel != null ? <span className="ds-slider__value">{valueLabel}</span> : null}
        </div>
      )}
      <input type="range" className="ds-slider__input" {...rest} />
    </div>
  );
}
