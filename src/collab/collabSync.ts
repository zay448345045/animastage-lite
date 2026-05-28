/**
 * Collaboration: BroadcastChannel (local tabs, no WebSocket) + optional WebRTC.
 */
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import type { TimelineKeyframe } from '../types';

export type CollabMode = 'local' | 'webrtc';

export interface CollabClipPayload {
  modelId: string;
  keyframes: TimelineKeyframe[];
  maxFrames: number;
  currentFrame: number;
  isPlaying: boolean;
}

export interface CollabSession {
  roomId: string;
  mode: CollabMode;
  destroy: () => void;
}

type LocalSession = CollabSession & {
  mode: 'local';
  channel: BroadcastChannel;
  pushClip: (payload: CollabClipPayload) => void;
  pushTransport: (frame: number, playing: boolean) => void;
  getTabCount: () => number;
};

type WebRtcSession = CollabSession & {
  mode: 'webrtc';
  doc: Y.Doc;
  provider: WebrtcProvider;
  clipMap: Y.Map<string>;
  transport: Y.Map<unknown>;
};

function channelName(roomId: string): string {
  return `animastage-collab-${roomId.trim() || 'default'}`;
}

const tabCounts = new Map<string, number>();

function registerTab(roomId: string): void {
  tabCounts.set(roomId, (tabCounts.get(roomId) ?? 0) + 1);
}

function unregisterTab(roomId: string): void {
  const n = (tabCounts.get(roomId) ?? 1) - 1;
  if (n <= 0) tabCounts.delete(roomId);
  else tabCounts.set(roomId, n);
}

function parseMessage(
  data: unknown,
  onRemoteClip: (payload: CollabClipPayload) => void,
  onRemoteTransport: (frame: number, playing: boolean) => void
): void {
  if (!data || typeof data !== 'object') return;
  const msg = data as { type?: string; payload?: unknown };
  if (msg.type === 'clip' && msg.payload) {
    onRemoteClip(msg.payload as CollabClipPayload);
  } else if (msg.type === 'transport' && msg.payload) {
    const p = msg.payload as { frame: number; playing: boolean };
    onRemoteTransport(p.frame, p.playing);
  }
}

/** Same browser / origin — no signaling servers, no WebSocket spam. */
export function joinCollabRoomLocal(
  roomId: string,
  onRemoteClip: (payload: CollabClipPayload) => void,
  onRemoteTransport: (frame: number, playing: boolean) => void
): LocalSession {
  const name = channelName(roomId);
  registerTab(name);

  const channel = new BroadcastChannel(name);
  channel.onmessage = (ev) => parseMessage(ev.data, onRemoteClip, onRemoteTransport);

  return {
    roomId,
    mode: 'local',
    channel,
    pushClip(payload) {
      channel.postMessage({ type: 'clip', payload });
    },
    pushTransport(frame, playing) {
      channel.postMessage({ type: 'transport', payload: { frame, playing } });
    },
    getTabCount() {
      return tabCounts.get(name) ?? 1;
    },
    destroy() {
      channel.close();
      unregisterTab(name);
    },
  };
}

const DEFAULT_SIGNALING = ['wss://y-webrtc-eu.fly.dev'];

function signalingUrls(): string[] {
  const custom = import.meta.env.VITE_COLLAB_SIGNALING as string | undefined;
  if (custom?.trim()) {
    return custom.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return DEFAULT_SIGNALING;
}

/** Cross-device P2P — only when signaling URL is reachable; use sparingly. */
export function joinCollabRoomWebRtc(
  roomId: string,
  onRemoteClip: (payload: CollabClipPayload) => void,
  onRemoteTransport: (frame: number, playing: boolean) => void
): WebRtcSession {
  const doc = new Y.Doc();
  const provider = new WebrtcProvider(roomId.trim() || 'animastage-default', doc, {
    signaling: signalingUrls(),
    maxConns: 12,
    filterBcConns: true,
    peerOpts: {
      config: {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      },
    },
  });

  const clipMap = doc.getMap<string>('clips');
  const transport = doc.getMap('transport');

  clipMap.observe((event) => {
    event.changes.keys.forEach((change, key) => {
      if (change.action === 'add' || change.action === 'update') {
        const raw = clipMap.get(key);
        if (raw) {
          try {
            onRemoteClip(JSON.parse(raw) as CollabClipPayload);
          } catch {
            /* ignore */
          }
        }
      }
    });
  });

  transport.observe(() => {
    const frame = transport.get('currentFrame');
    const playing = transport.get('isPlaying');
    if (typeof frame === 'number' && typeof playing === 'boolean') {
      onRemoteTransport(frame, playing);
    }
  });

  return {
    roomId,
    mode: 'webrtc',
    doc,
    provider,
    clipMap,
    transport,
    destroy() {
      try {
        provider.destroy();
      } catch {
        /* ignore */
      }
      doc.destroy();
    },
  };
}

export type ActiveCollabSession = LocalSession | WebRtcSession;

export function joinCollabRoom(
  roomId: string,
  mode: CollabMode,
  onRemoteClip: (payload: CollabClipPayload) => void,
  onRemoteTransport: (frame: number, playing: boolean) => void
): ActiveCollabSession {
  if (mode === 'webrtc') {
    return joinCollabRoomWebRtc(roomId, onRemoteClip, onRemoteTransport);
  }
  return joinCollabRoomLocal(roomId, onRemoteClip, onRemoteTransport);
}

export function pushCollabClip(session: ActiveCollabSession, payload: CollabClipPayload): void {
  if (session.mode === 'local') {
    session.pushClip(payload);
  } else {
    session.clipMap.set(payload.modelId, JSON.stringify(payload));
  }
}

export function pushCollabTransport(
  session: ActiveCollabSession,
  currentFrame: number,
  isPlaying: boolean
): void {
  if (session.mode === 'local') {
    session.pushTransport(currentFrame, isPlaying);
  } else {
    session.transport.set('currentFrame', currentFrame);
    session.transport.set('isPlaying', isPlaying);
  }
}

export function getCollabPeerCount(session: ActiveCollabSession): number {
  if (session.mode === 'local') {
    return session.getTabCount();
  }
  return session.provider.awareness.getStates().size;
}
