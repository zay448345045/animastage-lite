import { useCallback, useState, type ReactNode } from 'react';
import ProMobileTopBar from './ProMobileTopBar';
import ProMobileNav from './ProMobileNav';
import ProMobileFloatingControls from './ProMobileFloatingControls';
import ProMobileOnboarding from './ProMobileOnboarding';
import ProMobileMenuSheet from './ProMobileMenuSheet';
import ProSnapBottomSheet from './ProSnapBottomSheet';
import ProMobileControlPanel from './ProMobileControlPanel';
import type { ProMobileTab, ProSnapLevel } from './types';
import type { MobilePanelTab } from '../../hooks/useStudioLayout';
import type { StudioUiMode } from '../../flow/types';
import type { QualityMode } from '../../product/scene/types';

const TAB_TITLES: Record<ProMobileTab, string> = {
  scene: 'Scene & Load',
  control: 'Timeline',
  camera: 'Camera',
  fx: 'FX & Quality',
};

export interface ProMobileShellProps {
  sceneTitle: string;
  viewport: ReactNode;
  hasModel: boolean;
  isPlaying: boolean;
  manualOrbit: boolean;
  onTogglePlay: () => void;
  onToggleOrbit: () => void;
  onResetView: () => void;
  onShare: () => void;
  onExport: () => void;
  shareBusy?: boolean;
  onTryDemo: () => void;
  onSave: () => void;
  onOpenProject: () => void;
  onClearScene: () => void;
  mobilePanelTab: MobilePanelTab;
  onMobilePanelTabChange: (tab: MobilePanelTab) => void;
  renderPanel: (tab: ProMobileTab) => ReactNode;
  timeline?: ReactNode;
  optimizedHint?: boolean;
  uiMode: StudioUiMode;
  onUiModeChange: (mode: StudioUiMode) => void;
  qualityMode: QualityMode;
  onQualityModeChange: (mode: QualityMode) => void;
  onApplyTemplate: (templateId: string) => void;
}

export default function ProMobileShell({
  sceneTitle,
  viewport,
  hasModel,
  isPlaying,
  manualOrbit,
  onTogglePlay,
  onToggleOrbit,
  onResetView,
  onShare,
  onExport,
  shareBusy,
  onTryDemo,
  onSave,
  onOpenProject,
  onClearScene,
  mobilePanelTab,
  onMobilePanelTabChange,
  renderPanel,
  timeline,
  optimizedHint,
  uiMode,
  onUiModeChange,
  qualityMode,
  onQualityModeChange,
  onApplyTemplate,
}: ProMobileShellProps) {
  const [activeTab, setActiveTab] = useState<ProMobileTab | null>(null);
  const [snapLevel, setSnapLevel] = useState<ProSnapLevel>(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuSnap, setMenuSnap] = useState<ProSnapLevel>(0);

  const closeSheet = useCallback(() => {
    setActiveTab(null);
    setSnapLevel(0);
  }, []);

  const openTab = useCallback(
    (tab: ProMobileTab) => {
      if (activeTab === tab && snapLevel > 0) {
        closeSheet();
        return;
      }
      setActiveTab(tab);
      setSnapLevel(tab === 'control' ? 3 : 1);
      onMobilePanelTabChange(tab);
    },
    [activeTab, snapLevel, closeSheet, onMobilePanelTabChange]
  );

  const openMenu = useCallback(() => {
    setMenuOpen(true);
    setMenuSnap(2);
    closeSheet();
  }, [closeSheet]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setMenuSnap(0);
  }, []);

  const sheetOpen = activeTab !== null && snapLevel > 0;

  return (
    <div className="pro-mobile-shell flex-1 flex flex-col min-h-0 w-full relative">
      <div className="pro-mobile-chrome shrink-0">
        <ProMobileTopBar
          title={sceneTitle}
          onMenu={openMenu}
          onShare={onShare}
          onExport={onExport}
          shareBusy={shareBusy}
        />
      </div>

      <div className="pro-viewport-stage flex-1 min-h-0 relative flex flex-col">
        {viewport}
        <ProMobileOnboarding visible={!hasModel} onTryDemo={onTryDemo} />
        <ProMobileFloatingControls
          isPlaying={isPlaying}
          manualOrbit={manualOrbit}
          onTogglePlay={onTogglePlay}
          onToggleOrbit={onToggleOrbit}
          onResetView={onResetView}
        />
      </div>

      {activeTab ? (
        <ProSnapBottomSheet
          open={sheetOpen}
          title={TAB_TITLES[activeTab]}
          snapLevel={snapLevel}
          sheetMode={activeTab === 'control' ? 'timeline' : 'content'}
          onSnapChange={(lvl) => {
            if (lvl === 0) closeSheet();
            else setSnapLevel(lvl);
          }}
          onClose={closeSheet}
        >
          {activeTab === 'control' && timeline ? (
            <ProMobileControlPanel timeline={timeline} />
          ) : (
            <div className="pro-sheet-panel">{renderPanel(activeTab)}</div>
          )}
        </ProSnapBottomSheet>
      ) : null}

      <ProMobileMenuSheet
        open={menuOpen}
        snapLevel={menuSnap}
        onSnapChange={(lvl) => {
          if (lvl === 0) closeMenu();
          else setMenuSnap(lvl);
        }}
        onClose={closeMenu}
        onTryDemo={onTryDemo}
        onSave={onSave}
        onOpenProject={onOpenProject}
        onClearScene={onClearScene}
        onOpenFxTab={() => openTab('fx')}
        uiMode={uiMode}
        onUiModeChange={onUiModeChange}
        qualityMode={qualityMode}
        onQualityModeChange={onQualityModeChange}
        optimizedHint={optimizedHint}
        onApplyTemplate={onApplyTemplate}
      />

      <ProMobileNav
        activeTab={activeTab}
        isPlaying={isPlaying}
        onTab={openTab}
        onPlay={onTogglePlay}
      />
    </div>
  );
}
