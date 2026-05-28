import { Clapperboard } from 'lucide-react';
import {
  MOTION_TEMPLATE_CATEGORIES,
  TEMPLATE_CATEGORY_LABELS,
  getMotionTemplatesByCategory,
} from '../templates/animationTemplates';

interface AnimationTemplateSelectorProps {
  activeTemplateId: string | null | undefined;
  onSelect: (templateId: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function AnimationTemplateSelector({
  activeTemplateId,
  onSelect,
  disabled = false,
  className = '',
}: AnimationTemplateSelectorProps) {
  return (
    <div
      className={`flex items-center gap-2 bg-[#121418]/85 border border-zinc-800 rounded-md px-2 py-1 shadow-md backdrop-blur-sm ${className}`}
    >
      <Clapperboard className="w-3 h-3 text-[#39c5bb] shrink-0" />
      <label className="sr-only" htmlFor="motion-template-select">
        Motion template
      </label>
      <select
        id="motion-template-select"
        value={activeTemplateId ?? ''}
        disabled={disabled}
        onChange={(e) => {
          const id = e.target.value;
          if (id) onSelect(id);
        }}
        className="bg-transparent text-[10px] font-bold text-zinc-200 max-w-[220px] truncate cursor-pointer focus:outline-none focus:text-[#39c5bb] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="" className="bg-[#121418] text-zinc-400">
          — Motion template —
        </option>
        {MOTION_TEMPLATE_CATEGORIES.map((category) => {
          const templates = getMotionTemplatesByCategory(category);
          if (templates.length === 0) return null;
          return (
            <optgroup
              key={category}
              label={TEMPLATE_CATEGORY_LABELS[category]}
              className="bg-[#121418]"
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id} className="bg-[#121418] text-zinc-100">
                  {tpl.name}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </div>
  );
}
