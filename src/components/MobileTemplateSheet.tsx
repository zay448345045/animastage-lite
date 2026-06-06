import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Music2, Clapperboard } from 'lucide-react';
import type { TemplateApplyMode } from '../types';
import {
  ANIMATION_TEMPLATES,
  TEMPLATE_CATEGORY_LABELS,
  DANCE_PICKER_CATEGORIES,
  CHARACTER_PICKER_CATEGORIES,
  type AnimationTemplateCategory,
} from '../templates/animationTemplates';

type SheetSection = 'studio' | 'body' | 'camera' | 'combo' | 'character';

const SECTIONS: { id: SheetSection; label: string; categories: AnimationTemplateCategory[] }[] = [
  { id: 'studio', label: 'Studio', categories: DANCE_PICKER_CATEGORIES },
  { id: 'body', label: 'Body', categories: ['dance'] },
  { id: 'camera', label: 'Camera', categories: ['camera'] },
  { id: 'combo', label: 'Combo', categories: ['combo', 'emote'] },
  { id: 'character', label: 'Chars', categories: CHARACTER_PICKER_CATEGORIES },
];

function templateNeedsModel(category: AnimationTemplateCategory, hasModelKeys: boolean): boolean {
  return (
    category === 'character' ||
    category === 'dance' ||
    category === 'emote' ||
    (category === 'combo' && hasModelKeys)
  );
}

interface MobileTemplateSheetProps {
  open: boolean;
  onClose: () => void;
  onApplyTemplate: (templateId: string, mode?: TemplateApplyMode) => void;
  hasModel: boolean;
  hasVmdActive?: boolean;
  applyMode?: TemplateApplyMode;
}

export default function MobileTemplateSheet({
  open,
  onClose,
  onApplyTemplate,
  hasModel,
  hasVmdActive = false,
  applyMode = 'merge',
}: MobileTemplateSheetProps) {
  const [section, setSection] = useState<SheetSection>('studio');
  const [category, setCategory] = useState<AnimationTemplateCategory>('dance');

  const activeSection = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];
  const visibleCategories = activeSection.categories;

  useEffect(() => {
    if (!visibleCategories.includes(category)) {
      setCategory(visibleCategories[0]);
    }
  }, [category, visibleCategories]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const templates = ANIMATION_TEMPLATES.filter(
    (t) => visibleCategories.includes(t.category) && t.category === category
  );

  const isDanceHub = section !== 'character';

  return createPortal(
    <div className="md:hidden fixed inset-0 z-[250] flex flex-col justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 cursor-pointer"
        aria-label="Close templates"
        onClick={onClose}
      />
      <div className="relative bg-[#121418] border-t border-zinc-700 rounded-t-2xl shadow-2xl max-h-[min(65dvh,480px)] flex flex-col mb-[calc(52px+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800 shrink-0">
          <span className="text-sm font-bold text-[#39c5bb] flex items-center gap-2">
            <Music2 className="w-4 h-4" />
            Animation templates
          </span>
          <button type="button" onClick={onClose} className="p-2 text-zinc-400 cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-1 p-2 overflow-x-auto shrink-0 border-b border-zinc-800/80">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                section === s.id
                  ? 'bg-[#39c5bb]/20 text-[#39c5bb] border border-[#39c5bb]/40'
                  : 'bg-[#1a1d24] text-zinc-400 border border-zinc-800'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {visibleCategories.length > 1 && (
          <div className="flex gap-1 px-2 py-1.5 overflow-x-auto shrink-0">
            {visibleCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`shrink-0 px-2 py-1 rounded text-[10px] font-bold uppercase cursor-pointer ${
                  category === cat
                    ? 'bg-teal-950/50 text-[#39c5bb] border border-[#39c5bb]/30'
                    : 'text-zinc-500 border border-transparent'
                }`}
              >
                {TEMPLATE_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
          {templates.map((tpl) => {
            const needsModel = templateNeedsModel(
              tpl.category,
              Boolean(tpl.generateModelKeyframes)
            );
            const disabled = needsModel && !hasModel;
            return (
              <button
                key={tpl.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  onApplyTemplate(tpl.id, applyMode);
                  onClose();
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg border ${
                  disabled
                    ? 'opacity-40 border-zinc-800'
                    : 'border-zinc-800 bg-[#1a1d24] active:bg-[#252a35] cursor-pointer'
                }`}
              >
                <div className="text-sm font-bold text-zinc-100">{tpl.name}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">{tpl.description}</div>
                {disabled && (
                  <div className="text-[10px] text-amber-500 font-bold mt-1">Load a model first</div>
                )}
              </button>
            );
          })}
        </div>

        <div className="shrink-0 px-3 py-2 border-t border-zinc-800 text-[10px] text-zinc-500">
          {applyMode === 'merge' ? '+ Layer mode: stacks with existing keys' : 'Replace mode: overwrites keys'}
          {hasVmdActive && (
            <div className="text-amber-400/90 font-bold mt-1">VMD may auto-disable on body templates</div>
          )}
          {section === 'character' && (
            <div className="flex items-center gap-1 mt-1 text-[#e879ff]">
              <Clapperboard className="w-3 h-3" />
              Character morphs & gestures
            </div>
          )}
          {isDanceHub && section === 'studio' && (
            <div className="text-zinc-600 mt-0.5">Tip: Body + Camera layers work well together</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
