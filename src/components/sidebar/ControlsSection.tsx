import { Film, Lightbulb } from 'lucide-react';
import type { AppState, MMDModel } from '../../types';
import type { BoneState } from '../../types';
import type { PoseSnapshotV1 } from '../../pose/poseTypes';
import PoseLibraryPanel from '../editor/PoseLibraryPanel';
import { Button, CollapsibleSection, Panel, Select, Slider } from '../UI';

interface ControlsSectionProps {
  appState: AppState;
  selectedModel: MMDModel | undefined;
  selectedBone: BoneState | undefined;
  vmdActive: boolean;
  onSelectBone: (id: string | null) => void;
  onModifyMorphs: (modelId: string, morphName: 'eyes' | 'mouth' | 'brow', value: number) => void;
  onModifyBone: (modelId: string, boneId: string, axes: 'rotationX' | 'rotationY' | 'rotationZ', value: number) => void;
  onModifyModelPosition: (modelId: string, axis: 'positionX' | 'positionY' | 'positionZ', value: number) => void;
  onRegisterKeyframe: (modelId: string) => void;
  onSetVmdPlaybackEnabled: (modelId: string, enabled: boolean) => void;
  onApplyPose?: (pose: PoseSnapshotV1) => void;
  onCapturePose?: () => void;
  onClearPoseHold?: () => void;
}

export default function ControlsSection({
  appState,
  selectedModel,
  selectedBone,
  vmdActive,
  onSelectBone,
  onModifyMorphs,
  onModifyBone,
  onModifyModelPosition,
  onRegisterKeyframe,
  onSetVmdPlaybackEnabled,
  onApplyPose,
  onCapturePose,
  onClearPoseHold,
}: ControlsSectionProps) {
  if (!selectedModel) {
    return (
      <Panel className="text-center !py-[var(--space-xl)]">
        <p className="text-[var(--font-size-base)] text-[var(--color-text-muted)] m-0">
          Load a character to edit face, position, and pose.
        </p>
      </Panel>
    );
  }

  return (
    <>
      {selectedModel.hasVmdAnimation ? (
        <Panel className="!p-[var(--space-md)]">
          <div className="flex items-center justify-between gap-[var(--space-sm)]">
            <span className="text-[var(--font-size-base)] font-medium text-[var(--color-text-main)] flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5" />
              Motion playback
            </span>
            <Button
              type="button"
              variant={vmdActive ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => onSetVmdPlaybackEnabled(selectedModel.id, !vmdActive)}
            >
              {vmdActive ? 'On' : 'Off'}
            </Button>
          </div>
          <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] m-0 mt-[var(--space-sm)]">
            {vmdActive ? 'Imported motion drives the character.' : 'Motion paused — timeline controls the pose.'}
          </p>
        </Panel>
      ) : null}

      <CollapsibleSection title="Face controls" defaultOpen>
        <Slider
          label="Eyes"
          valueLabel={`${(selectedModel.morphs.eyes * 100).toFixed(0)}%`}
          min={0}
          max={1}
          step={0.01}
          value={selectedModel.morphs.eyes}
          onChange={(e) => onModifyMorphs(selectedModel.id, 'eyes', parseFloat(e.target.value))}
        />
        <Slider
          label="Mouth"
          valueLabel={`${(selectedModel.morphs.mouth * 100).toFixed(0)}%`}
          min={0}
          max={1}
          step={0.01}
          value={selectedModel.morphs.mouth}
          onChange={(e) => onModifyMorphs(selectedModel.id, 'mouth', parseFloat(e.target.value))}
        />
        <Slider
          label="Brows"
          valueLabel={`${(selectedModel.morphs.brow * 100).toFixed(0)}%`}
          min={0}
          max={1}
          step={0.01}
          value={selectedModel.morphs.brow}
          onChange={(e) => onModifyMorphs(selectedModel.id, 'brow', parseFloat(e.target.value))}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Position" defaultOpen={false}>
        <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] m-0">
          Move the whole character on stage, or drag the ring under the model in the viewport.
        </p>
        {(['positionX', 'positionY', 'positionZ'] as const).map((axis) => {
          const label = axis === 'positionX' ? 'X' : axis === 'positionY' ? 'Y' : 'Z';
          return (
            <Slider
              key={axis}
              label={label}
              valueLabel={selectedModel[axis].toFixed(2)}
              min={axis === 'positionY' ? -5 : -20}
              max={axis === 'positionY' ? 20 : 20}
              step={0.05}
              value={selectedModel[axis]}
              onChange={(e) =>
                onModifyModelPosition(selectedModel.id, axis, parseFloat(e.target.value))
              }
            />
          );
        })}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => {
            onModifyModelPosition(selectedModel.id, 'positionX', 0);
            onModifyModelPosition(selectedModel.id, 'positionY', 0);
            onModifyModelPosition(selectedModel.id, 'positionZ', 0);
            onSelectBone(null);
          }}
        >
          Reset position
        </Button>
      </CollapsibleSection>

      <CollapsibleSection title="Pose" defaultOpen={false}>
        <div>
          <label className="block text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mb-[var(--space-xs)]">
            Selected bone
          </label>
          <Select value={appState.selectedBoneId || ''} onChange={(e) => onSelectBone(e.target.value || null)}>
            <option value="">Choose a bone…</option>
            {selectedModel.bones.map((bone) => (
              <option key={bone.id} value={bone.id}>
                {bone.name}
              </option>
            ))}
          </Select>
        </div>
        {selectedBone ? (
          <>
            {(['rotationX', 'rotationY', 'rotationZ'] as const).map((axis) => {
              const label = axis === 'rotationX' ? 'Pitch' : axis === 'rotationY' ? 'Yaw' : 'Roll';
              return (
                <Slider
                  key={axis}
                  label={label}
                  valueLabel={`${selectedBone[axis]}°`}
                  min={-180}
                  max={180}
                  value={selectedBone[axis]}
                  onChange={(e) =>
                    onModifyBone(selectedModel.id, selectedBone.id, axis, parseInt(e.target.value, 10))
                  }
                />
              );
            })}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => {
                onModifyBone(selectedModel.id, selectedBone.id, 'rotationX', 0);
                onModifyBone(selectedModel.id, selectedBone.id, 'rotationY', 0);
                onModifyBone(selectedModel.id, selectedBone.id, 'rotationZ', 0);
              }}
            >
              Reset bone rotation
            </Button>
          </>
        ) : (
          <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] m-0 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 shrink-0" />
            Select a bone in the list or tap a joint in the viewport.
          </p>
        )}
      </CollapsibleSection>

      {onApplyPose && onCapturePose && onClearPoseHold ? (
        <CollapsibleSection title="Pose library" defaultOpen={false}>
          <PoseLibraryPanel
            activePoseId={selectedModel.activePoseId ?? null}
            disabled={false}
            onApplyPose={onApplyPose}
            onCapturePose={onCapturePose}
            onClearPose={onClearPoseHold}
          />
        </CollapsibleSection>
      ) : null}

      <Button
        type="button"
        variant="primary"
        className="w-full"
        disabled={!selectedModel}
        onClick={() => onRegisterKeyframe(selectedModel.id)}
      >
        Add keyframe · frame {appState.currentFrame}
      </Button>
    </>
  );
}
