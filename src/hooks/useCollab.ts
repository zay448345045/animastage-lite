import { useCallback, useEffect, useRef, useState } from 'react';
import {
  joinCollabRoom,
  pushCollabClip,
  pushCollabTransport,
  getCollabPeerCount,
  type ActiveCollabSession,
  type CollabClipPayload,
  type CollabMode,
} from '../collab/collabSync';

export function useCollab(
  onRemoteClip: (payload: CollabClipPayload) => void,
  onRemoteTransport: (frame: number, playing: boolean) => void
) {
  const sessionRef = useRef<ActiveCollabSession | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [mode, setMode] = useState<CollabMode>('local');
  const [peers, setPeers] = useState(0);
  const [status, setStatus] = useState('');

  const join = useCallback(
    (room: string, joinMode: CollabMode = 'local') => {
      sessionRef.current?.destroy();
      try {
        const session = joinCollabRoom(room, joinMode, onRemoteClip, onRemoteTransport);
        sessionRef.current = session;
        setRoomId(room);
        setMode(joinMode);
        setConnected(true);
        setPeers(getCollabPeerCount(session));
        setStatus(
          joinMode === 'local'
            ? 'Local sync (tabs in this browser)'
            : 'WebRTC — waiting for peers…'
        );
      } catch (e) {
        setStatus((e as Error).message);
        setConnected(false);
      }
    },
    [onRemoteClip, onRemoteTransport]
  );

  const leave = useCallback(() => {
    sessionRef.current?.destroy();
    sessionRef.current = null;
    setConnected(false);
    setPeers(0);
    setStatus('');
  }, []);

  useEffect(() => {
    if (!connected) return;
    const id = window.setInterval(() => {
      if (sessionRef.current) setPeers(getCollabPeerCount(sessionRef.current));
    }, 3000);
    return () => clearInterval(id);
  }, [connected]);

  useEffect(() => () => sessionRef.current?.destroy(), []);

  const broadcastClip = useCallback((payload: CollabClipPayload) => {
    if (sessionRef.current) pushCollabClip(sessionRef.current, payload);
  }, []);

  const broadcastTransport = useCallback((frame: number, playing: boolean) => {
    if (sessionRef.current) pushCollabTransport(sessionRef.current, frame, playing);
  }, []);

  return {
    connected,
    roomId,
    mode,
    peers,
    status,
    join,
    leave,
    broadcastClip,
    broadcastTransport,
  };
}
