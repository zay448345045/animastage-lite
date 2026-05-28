import React, { useState, useRef, useEffect } from 'react';
import { Clapperboard, Camera as CameraIcon, User, Sparkles, ChevronDown, Zap, Music2 } from 'lucide-react';
import type { TemplateApplyMode } from '../types';
import {
  ANIMATION_TEMPLATES,
  TEMPLATE_CATEGORY_LABELS,
  DANCE_PICKER_CATEGORIES,
  type AnimationTemplateCategory,
} from '../templates/animationTemplates';

interface TemplatePickerProps {
  onApplyTemplate: (templateId: string, mode?: TemplateApplyMode) => void;
  hasModel: boolean;
  hasVmdActive?: boolean;
  compact?: boolean;
  categories?: AnimationTemplateCategory[];
  label?: string;
  title?: string;
  variant?: 'dance' | 'default';
  applyMode?: TemplateApplyMode;
}

const CATEGORY_ICONS: Record<AnimationTemplateCategory, React.ReactNode> = {
  camera: <CameraIcon className="w-3.5 h-3.5" />,
  character: <User className="w-3.5 h-3.5" />,
  combo: <Sparkles className="w-3.5 h-3.5" />,
  emote: <Zap className="w-3.5 h-3.5" />,
  dance: <Music2 className="w-3.5 h-3.5" />,
};

const DEFAULT_CATEGORIES: AnimationTemplateCategory[] = ['character'];

function templateNeedsModel(category: AnimationTemplateCategory, hasModelKeys: boolean): boolean {
  return (
    category === 'character' ||
    category === 'dance' ||
    category === 'emote' ||
    (category === 'combo' && hasModelKeys)
  );
}

function isDanceHubCategories(categories: AnimationTemplateCategory[]): boolean {
  return (
    categories.length === DANCE_PICKER_CATEGORIES.length &&
    DANCE_PICKER_CATEGORIES.every((c) => categories.includes(c))
  );
}

export default function TemplatePicker({
  onApplyTemplate,
  hasModel,
  hasVmdActive = false,
  compact = false,
  categories,
  label,
  title,
  variant = 'default',
  applyMode = 'merge',
}: TemplatePickerProps) {
  const visibleCategories = categories ?? DEFAULT_CATEGORIES;
  const isDanceHub =
    variant === 'dance' ||
    isDanceHubCategories(visibleCategories) ||
    visibleCategories.some((c) => c === 'dance' || c === 'camera' || c === 'combo' || c === 'emote');
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<AnimationTemplateCategory>(visibleCategories[0]);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonLabel = label ?? (isDanceHub ? 'Dance' : 'Templates');
  const buttonTitle =
    title ??
    (isDanceHub
      ? 'Body dance, camera paths, combos & bloom emotes'
      : 'Character expressions and gestures');

  useEffect(() => {
    if (!visibleCategories.includes(category)) {
      setCategory(visibleCategories[0]);
    }
  }, [category, visibleCategories]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const templates = ANIMATION_TEMPLATES.filter(
    (t) => visibleCategories.includes(t.category) && t.category === category
  );

  const handleSelect = (templateId: string, needsModel: boolean) => {
    if (needsModel && !hasModel) return;
    onApplyTemplate(templateId, applyMode);
    setOpen(false);
  };

  const accentClass = isDanceHub
    ? 'text-teal-200 bg-teal-950/40 border-teal-500/40 hover:bg-teal-950/60'
    : 'text-violet-200 bg-violet-950/40 border-violet-500/40 hover:bg-violet-950/60';

  const accentIconClass = isDanceHub ? 'text-[#39c5bb]' : 'text-[#e879ff]';
  const accentTextClass = isDanceHub ? 'text-[#39c5bb]' : 'text-[#e879ff]';
  const tabActiveClass = isDanceHub
    ? 'bg-teal-950/50 text-[#39c5bb] border-b-2 border-[#39c5bb]'
    : 'bg-[#e879ff]/15 text-[#e879ff] border-b-2 border-[#e879ff]';
  const itemHoverClass = isDanceHub
    ? 'hover:bg-teal-950/40 hover:border-teal-500/30'
    : 'hover:bg-[#e879ff]/10 hover:border-[#e879ff]/20';

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`cursor-pointer font-bold border rounded flex items-center gap-1.5 transition-all ${accentClass} ${
          compact ? 'text-[10px] px-2.5 py-1.5' : 'text-xs px-3 py-1.5'
        }`}
        title={buttonTitle}
      >
        {isDanceHub ? (
          <Music2 className={`w-3.5 h-3.5 ${accentIconClass}`} />
        ) : (
          <Clapperboard className={`w-3.5 h-3.5 ${accentIconClass}`} />
        )}
        {buttonLabel}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 bottom-full mb-1 z-50 w-80 bg-[#121418] border border-zinc-700 rounded-lg shadow-2xl overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-800 bg-[#1a1d24]">
            <span className={`text-[10px] font-bold uppercase tracking-wide ${accentTextClass}`}>
              {isDanceHub ? 'Dance Studio' : 'Character Templates'}
            </span>
          </div>

          {visibleCategories.length > 1 && (
            <div className="flex flex-wrap border-b border-zinc-800">
              {visibleCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex-1 min-w-[20%] flex items-center justify-center gap-0.5 py-2 px-1 text-[8px] font-bold uppercase cursor-pointer transition-colors ${
                    category === cat
                      ? tabActiveClass
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  {CATEGORY_ICONS[cat]}
                  <span className="truncate">{TEMPLATE_CATEGORY_LABELS[cat]}</span>
                </button>
              ))}
            </div>
          )}

          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
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
                  onClick={() => handleSelect(tpl.id, needsModel)}
                  className={`w-full text-left px-2.5 py-2 rounded-md transition-all ${
                    disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : `cursor-pointer border border-transparent ${itemHoverClass}`
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-zinc-100">{tpl.name}</span>
                    {tpl.visualFx?.bloom && (
                      <span className="text-[8px] font-bold text-[#e879ff] bg-[#e879ff]/10 px-1.5 py-0.5 rounded shrink-0">
                        BLOOM
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-zinc-500 leading-snug mt-0.5">{tpl.description}</div>
                  {disabled && (
                    <div className="text-[8px] text-amber-500/90 mt-1 font-bold">Load a model first</div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="px-3 py-2 border-t border-zinc-800 text-[8px] text-zinc-500 space-y-1">
            {applyMode === 'merge'
              ? 'Add layer: stacks with existing body / camera keys'
              : 'Replace: overwrites keys from this template only'}
            {isDanceHub && applyMode === 'merge' && ' · try + Body then + Camera'}
            {hasVmdActive && (
              <div className="text-amber-400/90 font-bold">
                Body templates auto-disable imported VMD to avoid conflicts.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
