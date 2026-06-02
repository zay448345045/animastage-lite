import { listSceneTemplates } from '../templates/sceneTemplates';

interface TemplatePickerProps {
  beginnerMode: boolean;
  onApplyTemplate: (templateId: string) => void;
  /** Desktop bar vs vertical list in mobile menu */
  variant?: 'bar' | 'menu';
}

/** Beginner-mode template chips — orchestrates via TemplateManager in parent. */
export default function TemplatePicker({
  beginnerMode,
  onApplyTemplate,
  variant = 'bar',
}: TemplatePickerProps) {
  if (!beginnerMode) return null;

  const templates = listSceneTemplates();

  if (variant === 'menu') {
    return (
      <div className="pro-menu-templates">
        <p className="pro-mobile-menu-settings__label">Scene templates</p>
        <ul className="pro-menu-templates__list">
          {templates.map((tpl) => (
            <li key={tpl.id}>
              <button
                type="button"
                title={tpl.description}
                onClick={() => onApplyTemplate(tpl.id)}
                className="pro-menu-templates__btn"
              >
                {tpl.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="shrink-0 flex flex-wrap items-center gap-1.5 px-3 py-2 bg-[#0a0b0e] border-b border-zinc-800/60">
      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mr-1">Templates</span>
      {templates.map((tpl) => (
        <button
          key={tpl.id}
          type="button"
          title={tpl.description}
          onClick={() => onApplyTemplate(tpl.id)}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-zinc-800/80 hover:bg-cyan-900/50 hover:text-cyan-200 text-zinc-300 border border-zinc-700/80 cursor-pointer transition-colors"
        >
          {tpl.label}
        </button>
      ))}
    </div>
  );
}
