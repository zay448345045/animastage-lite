import { useCallback, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { MMDLoader, MMDAnimationHelper } from 'three-stdlib';
import type {
  CameraFocusTarget,
  CameraFramingMode,
  CameraKeyframe,
  CameraMode,
  CameraSnapshot,
} from '../types';
import { computeDuoFovBoost } from '../scene/characterHeadRegistry';
import { offsetCameraSnapshotToFocus } from '../scene/cameraFocus';
import {
  applyCameraSnapshot,
  applyCameraSnapshotDamped,
  applyDefaultStageCamera,
  captureCameraSnapshot,
  evaluateCameraAtFrame,
  isCameraPoseValid,
  syncMmdCameraMixerToFrame,
  syncOrbitFromCamera,
} from './CameraLogic';
import { frameToTime, seekAnimationMixer } from '../utils/animationSync';
import { playheadRef, MMD_FPS } from '../utils/playhead';
import {
  CameraFollowProvider,
  useCameraFollowOptional,
} from '../context/CameraFollowContext';
import {
  CAMERA_DAMP_FACTOR,
  MAX_POLAR_ANGLE,
  MIN_POLAR_ANGLE,
} from '../utils/cameraFollow';
import { isRecordingCapture } from '../video/recordingCapture';

const DEFAULT_ORBIT_TARGET = new THREE.Vector3(0, 10, 0);
const FALLBACK_CAMERA: CameraSnapshot = {
  position: [0, 14, 28],
  rotation: [0, 0, 0],
  fov: 45,
  target: [0, 10, 0],
};

const MMD_PLAYBACK_DAMP = 0.28;
const MMD_RECORD_DAMP = 1;

type CameraHelperObjects = {
  mixer?: THREE.AnimationMixer;
};

type CameraHelperWithObjects = MMDAnimationHelper & {
  objects: Map<THREE.Object3D, CameraHelperObjects>;
  cameraTarget: THREE.Object3D;
};

function getCameraMixer(helper: MMDAnimationHelper, camera: THREE.Camera): THREE.AnimationMixer | undefined {
  return (helper as CameraHelperWithObjects).objects.get(camera)?.mixer;
}

interface MMDCameraControllerProps {
  cameraMode: CameraMode;
  cameraFraming?: CameraFramingMode;
  followModelId?: string | null;
  autoFocus?: boolean;
  manualCameraLock?: boolean;
  focusTarget?: CameraFocusTarget;
  cameraOrbitAnchor?: [number, number, number];
  currentFrame: number;
  isPlaying: boolean;
  playSpeed: number;
  cameraKeyframes: CameraKeyframe[];
  cameraVmdBlobUrl?: string | null;
  hasCameraVmd?: boolean;
  onCaptureReady?: (capture: () => CameraSnapshot | null) => void;
  onFlyToReady?: (fly: (snapshot: CameraSnapshot) => void) => void;
  onCameraModeExit?: (snapshot: CameraSnapshot) => void;
}

function MMDCameraControllerInner({
  cameraMode,
  cameraFraming = 'single',
  followModelId = null,
  autoFocus = true,
  manualCameraLock = false,
  focusTarget = 'body',
  cameraOrbitAnchor = [0, 10, 0],
  currentFrame,
  isPlaying,
  playSpeed,
  cameraKeyframes,
  cameraVmdBlobUrl,
  hasCameraVmd = false,
  onCaptureReady,
  onFlyToReady,
  onCameraModeExit,
}: MMDCameraControllerProps) {
  const { camera } = useThree();
  const perspectiveCamera = camera as THREE.PerspectiveCamera;
  const cameraFollow = useCameraFollowOptional();

  const orbitRef = useRef<OrbitControlsImpl>(null);
  const helperRef = useRef<MMDAnimationHelper | null>(null);
  const vmdReadyRef = useRef(false);
  const cameraModeRef = useRef(cameraMode);
  const currentFrameRef = useRef(currentFrame);
  const isPlayingRef = useRef(isPlaying);
  const playSpeedRef = useRef(playSpeed);
  const cameraKeyframesRef = useRef(cameraKeyframes);
  const hasCameraVmdRef = useRef(hasCameraVmd);
  const autoFocusRef = useRef(autoFocus);
  const manualLockRef = useRef(manualCameraLock);
  const anchorRef = useRef(cameraOrbitAnchor);
  const prevCameraModeRef = useRef<CameraMode>(cameraMode);
  const lastAppliedFrameRef = useRef(-1);
  const wasPlayingCameraRef = useRef(false);

  const goalPosition = useRef(new THREE.Vector3(0, 14, 28));
  const goalTarget = useRef(new THREE.Vector3(0, 10, 0));
  const smoothPosition = useRef(new THREE.Vector3(0, 14, 28));
  const smoothTarget = useRef(new THREE.Vector3(0, 10, 0));
  const focusScratch = useRef(new THREE.Vector3(0, 10, 0));

  const orbitEnabled =
    cameraMode === 'free' || (cameraMode === 'mmd' && manualCameraLock);

  useEffect(() => {
    smoothPosition.current.copy(perspectiveCamera.position);
    if (orbitRef.current) {
      smoothTarget.current.copy(orbitRef.current.target);
    } else {
      smoothTarget.current.copy(DEFAULT_ORBIT_TARGET);
    }
    goalPosition.current.copy(smoothPosition.current);
    goalTarget.current.copy(smoothTarget.current);
  }, []);

  useEffect(() => {
    autoFocusRef.current = autoFocus;
  }, [autoFocus]);

  useEffect(() => {
    manualLockRef.current = manualCameraLock;
  }, [manualCameraLock]);

  useEffect(() => {
    anchorRef.current = cameraOrbitAnchor;
  }, [cameraOrbitAnchor]);

  useEffect(() => {
    if (cameraMode !== 'mmd') return;
    const hasMotion =
      (hasCameraVmd && Boolean(cameraVmdBlobUrl)) || cameraKeyframes.length > 0;
    if (hasMotion) return;
    applyDefaultStageCamera(perspectiveCamera);
    goalPosition.current.set(0, 14, 28);
    goalTarget.current.copy(DEFAULT_ORBIT_TARGET);
    smoothPosition.current.copy(goalPosition.current);
    smoothTarget.current.copy(goalTarget.current);
  }, [cameraMode, hasCameraVmd, cameraVmdBlobUrl, cameraKeyframes.length, perspectiveCamera]);

  useEffect(() => {
    cameraModeRef.current = cameraMode;
  }, [cameraMode]);

  useEffect(() => {
    currentFrameRef.current = currentFrame;
  }, [currentFrame]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    playSpeedRef.current = playSpeed;
  }, [playSpeed]);

  useEffect(() => {
    cameraKeyframesRef.current = cameraKeyframes;
  }, [cameraKeyframes]);

  useEffect(() => {
    hasCameraVmdRef.current = hasCameraVmd;
  }, [hasCameraVmd]);

  useEffect(() => {
    helperRef.current = new MMDAnimationHelper();
    return () => {
      helperRef.current = null;
    };
  }, []);

  useEffect(() => {
    const helper = helperRef.current;
    if (!helper || !hasCameraVmd || !cameraVmdBlobUrl) {
      vmdReadyRef.current = false;
      return;
    }

    let cancelled = false;
    vmdReadyRef.current = false;

    const loader = new MMDLoader();
    loader.loadAnimation(
      cameraVmdBlobUrl,
      perspectiveCamera,
      (animation) => {
        if (cancelled || !helperRef.current) return;
        helperRef.current.add(perspectiveCamera, {
          animation: animation as THREE.AnimationClip,
        });
        helperRef.current.enable('cameraAnimation', true);
        vmdReadyRef.current = true;
        lastAppliedFrameRef.current = -1;
      },
      undefined,
      (err) => {
        console.error('[MMD Camera] VMD load error:', err);
        vmdReadyRef.current = false;
      }
    );

    return () => {
      cancelled = true;
      vmdReadyRef.current = false;
      if (helperRef.current) {
        try {
          helperRef.current.remove(perspectiveCamera);
        } catch {
          /* ignore */
        }
      }
    };
  }, [cameraVmdBlobUrl, hasCameraVmd, perspectiveCamera]);

  const capture = useCallback((): CameraSnapshot | null => {
    if (!(perspectiveCamera instanceof THREE.PerspectiveCamera)) return null;
    const target = orbitRef.current?.target ?? smoothTarget.current;
    return captureCameraSnapshot(perspectiveCamera, target);
  }, [perspectiveCamera]);

  useEffect(() => {
    onCaptureReady?.(capture);
  }, [capture, onCaptureReady]);

  const flyTo = useCallback(
    (snapshot: CameraSnapshot) => {
      applyCameraSnapshot(perspectiveCamera, snapshot);
      smoothPosition.current.set(snapshot.position[0], snapshot.position[1], snapshot.position[2]);
      smoothTarget.current.set(snapshot.target[0], snapshot.target[1], snapshot.target[2]);
      if (orbitRef.current) {
        syncOrbitFromCamera(perspectiveCamera, orbitRef.current.target, DEFAULT_ORBIT_TARGET);
        orbitRef.current.target.set(snapshot.target[0], snapshot.target[1], snapshot.target[2]);
        orbitRef.current.update();
      }
    },
    [perspectiveCamera]
  );

  useEffect(() => {
    onFlyToReady?.(flyTo);
  }, [flyTo, onFlyToReady]);

  useEffect(() => {
    const prevMode = prevCameraModeRef.current;
    if (prevMode === 'mmd' && cameraMode === 'free') {
      const helper = helperRef.current as CameraHelperWithObjects | null;
      const target = new THREE.Vector3();
      if (helper?.cameraTarget) {
        helper.cameraTarget.getWorldPosition(target);
      } else {
        target.copy(DEFAULT_ORBIT_TARGET);
      }

      const snapshot = captureCameraSnapshot(perspectiveCamera, target);
      applyCameraSnapshot(perspectiveCamera, snapshot);
      smoothPosition.current.set(snapshot.position[0], snapshot.position[1], snapshot.position[2]);
      smoothTarget.current.set(snapshot.target[0], snapshot.target[1], snapshot.target[2]);

      if (orbitRef.current) {
        syncOrbitFromCamera(perspectiveCamera, orbitRef.current.target, DEFAULT_ORBIT_TARGET);
        orbitRef.current.update();
      }

      onCameraModeExit?.(snapshot);
    }

    prevCameraModeRef.current = cameraMode;
  }, [cameraMode, onCameraModeExit, perspectiveCamera]);

  useFrame((_, delta) => {
    if (!(perspectiveCamera instanceof THREE.PerspectiveCamera)) return;

    const mode = cameraModeRef.current;
    const frame = isPlayingRef.current ? playheadRef.current : currentFrameRef.current;
    const fps = MMD_FPS;
    const time = frameToTime(frame, fps);
    const helper = helperRef.current as CameraHelperWithObjects | null;

    if (mode === 'free') {
      if (helper) helper.enable('cameraAnimation', false);
      return;
    }

    if (manualLockRef.current) {
      if (helper) helper.enable('cameraAnimation', false);
      return;
    }

    const focus = cameraFollow
      ? cameraFollow.getHeadTarget(DEFAULT_ORBIT_TARGET, focusScratch.current)
      : focusScratch.current.copy(DEFAULT_ORBIT_TARGET);

    const hasCameraMotion =
      (hasCameraVmdRef.current && vmdReadyRef.current) ||
      cameraKeyframesRef.current.length > 0;

    if (!hasCameraMotion) {
      if (helper) helper.enable('cameraAnimation', false);
      if (autoFocusRef.current) {
        const snap = offsetCameraSnapshotToFocus(
          FALLBACK_CAMERA,
          anchorRef.current,
          focus
        );
        const damp = isRecordingCapture() ? MMD_RECORD_DAMP : CAMERA_DAMP_FACTOR;
        applyCameraSnapshotDamped(
          perspectiveCamera,
          snap,
          goalPosition.current,
          goalTarget.current,
          damp
        );
      } else {
        applyDefaultStageCamera(perspectiveCamera);
        perspectiveCamera.lookAt(DEFAULT_ORBIT_TARGET);
      }
      return;
    }

    const useVmd = hasCameraVmdRef.current && vmdReadyRef.current && helper?.camera;
    const capturing = isRecordingCapture();
    const damp = capturing
      ? MMD_RECORD_DAMP
      : isPlayingRef.current
        ? MMD_PLAYBACK_DAMP
        : CAMERA_DAMP_FACTOR;

    if (useVmd && helper) {
      helper.enable('cameraAnimation', true);
      const playing = isPlayingRef.current;
      const mixer = getCameraMixer(helper, perspectiveCamera);

      if (playing) {
        if (!wasPlayingCameraRef.current && mixer) {
          seekAnimationMixer(mixer, time);
        }
        helper.update(delta);
      } else {
        seekAnimationMixer(mixer, time);
        syncMmdCameraMixerToFrame(mixer, frame, fps, perspectiveCamera, helper.cameraTarget);
      }

      if (autoFocusRef.current) {
        if (capturing || damp >= 1) {
          perspectiveCamera.lookAt(focus);
        } else {
          smoothTarget.current.lerp(focus, damp);
          perspectiveCamera.lookAt(smoothTarget.current);
        }
        if (orbitRef.current?.target) {
          orbitRef.current.target.copy(focus);
        }
      } else {
        helper.cameraTarget.getWorldPosition(_headScratch);
        smoothTarget.current.lerp(_headScratch, damp);
        perspectiveCamera.lookAt(smoothTarget.current);
      }

      if (!isCameraPoseValid(perspectiveCamera)) {
        applyDefaultStageCamera(perspectiveCamera);
      }
      lastAppliedFrameRef.current = frame;
      wasPlayingCameraRef.current = playing;
      return;
    }

    if (helper) helper.enable('cameraAnimation', false);

    const evaluated = evaluateCameraAtFrame(
      cameraKeyframesRef.current,
      frame,
      FALLBACK_CAMERA
    );
    evaluated.fov = computeDuoFovBoost(evaluated.fov, cameraFraming);

    const snapshot = autoFocusRef.current
      ? offsetCameraSnapshotToFocus(evaluated, anchorRef.current, focus)
      : evaluated;

    if (capturing || damp >= 1) {
      applyCameraSnapshot(perspectiveCamera, snapshot);
      goalPosition.current.set(snapshot.position[0], snapshot.position[1], snapshot.position[2]);
      goalTarget.current.set(snapshot.target[0], snapshot.target[1], snapshot.target[2]);
    } else {
      applyCameraSnapshotDamped(
        perspectiveCamera,
        snapshot,
        goalPosition.current,
        goalTarget.current,
        damp
      );
    }
    smoothPosition.current.copy(perspectiveCamera.position);
    smoothTarget.current.copy(goalTarget.current);

    if (orbitRef.current?.target) {
      orbitRef.current.target.set(snapshot.target[0], snapshot.target[1], snapshot.target[2]);
      orbitRef.current.update();
    }

    if (!isCameraPoseValid(perspectiveCamera)) {
      applyDefaultStageCamera(perspectiveCamera);
    }

    lastAppliedFrameRef.current = frame;
    wasPlayingCameraRef.current = isPlayingRef.current;
  });

  return (
    <OrbitControls
      ref={orbitRef}
      makeDefault
      enabled={orbitEnabled}
      enableDamping
      dampingFactor={0.05}
      target={[DEFAULT_ORBIT_TARGET.x, DEFAULT_ORBIT_TARGET.y, DEFAULT_ORBIT_TARGET.z]}
      minDistance={2}
      maxDistance={120}
      minPolarAngle={MIN_POLAR_ANGLE}
      maxPolarAngle={MAX_POLAR_ANGLE}
    />
  );
}

const _headScratch = new THREE.Vector3();

export default function MMDCameraController(props: MMDCameraControllerProps) {
  const followEnabled =
    props.cameraMode === 'mmd' &&
    props.autoFocus !== false &&
    !props.manualCameraLock;

  return (
    <CameraFollowProvider
      enabled={followEnabled}
      framing={props.cameraFraming ?? 'single'}
      followModelId={props.followModelId ?? null}
      focusTarget={props.focusTarget ?? 'body'}
    >
      <MMDCameraControllerInner {...props} />
    </CameraFollowProvider>
  );
}
