// ─── hooks/useAbly.js ─────────────────────────────────────────────────────
import { useEffect, useRef, useCallback, useState } from 'react';
import * as Ably from 'ably';

const ABLY_KEY = import.meta.env.VITE_ABLY_KEY;

const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'];

// HOST ELECTION: whoever joined earliest is the host.
// On any new `enter` event, every existing member checks if they are the host.
// Only the host publishes board-sync → exactly one sync per new joiner.
function amIHost(myPlayerId, members) {
  if (!members?.length) return false;
  const sorted = [...members].sort(
    (a, b) => (a.data?.joinedAt ?? Infinity) - (b.data?.joinedAt ?? Infinity)
  );
  return sorted[0]?.clientId === myPlayerId;
}

export function useAbly({ roomId, playerId, playerName, onEvent, getBoardSnapshot }) {
  const clientRef  = useRef(null);
  const channelRef = useRef(null);

  // BUG FIX: keep refs to callbacks so the effect closure never goes stale.
  // Previously these were named identically to the params, causing a JS
  // "duplicate declaration" crash in strict mode / some bundlers.
  const onEventRef          = useRef(null);
  const getBoardSnapshotRef = useRef(null);
  onEventRef.current          = onEvent;
  getBoardSnapshotRef.current = getBoardSnapshot;

  const [connected, setConnected] = useState(false);
  const [players,   setPlayers]   = useState({});

  const [myColor]  = useState(() => PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)]);
  const [joinedAt] = useState(() => Date.now());

  useEffect(() => {
    if (!roomId || !playerId || !ABLY_KEY) {
      if (!ABLY_KEY) console.error('[useAbly] VITE_ABLY_KEY is not set!');
      return;
    }

    const client = new Ably.Realtime({
      key:          ABLY_KEY,
      clientId:     playerId,
      echoMessages: false,
    });
    clientRef.current = client;

    const channel = client.channels.get(`sudoku-room-${roomId}`);
    channelRef.current = channel;

    // ── Connection state ──────────────────────────────────────────────
    client.connection.on('connected',    () => setConnected(true));
    client.connection.on('disconnected', () => setConnected(false));
    client.connection.on('failed',       () => setConnected(false));

    // ── All inbound events → Game.jsx handler ─────────────────────────
    // echoMessages:false means we won't get our own publishes back.
    // senderId guard is a secondary safety net.
    channel.subscribe((msg) => {
      if (msg.data?.senderId === playerId) return;
      onEventRef.current?.(msg.name, msg.data);
    });

    // ── Presence: new member enters → host broadcasts board state ─────
    channel.presence.subscribe('enter', async (newMember) => {
      // Always update local player list
      setPlayers(prev => ({ ...prev, [newMember.clientId]: newMember.data }));

      // Ask Ably for the authoritative member list to elect a host
      try {
        const members = await channel.presence.get();
        if (!amIHost(playerId, members)) return; // only host syncs

        const board = getBoardSnapshotRef.current?.();
        if (!board) return;

        channel.publish('board-sync', {
          board,
          senderId: playerId,
          targetId: newMember.clientId, // informational only, Ably has no unicast
        });
        console.log(`[useAbly] Host sent board-sync to ${newMember.clientId}`);
      } catch (err) {
        console.warn('[useAbly] board-sync failed:', err);
      }
    });

    channel.presence.subscribe('leave', (member) => {
      setPlayers(prev => {
        const next = { ...prev };
        delete next[member.clientId];
        return next;
      });
    });

    channel.presence.subscribe('update', (member) => {
      setPlayers(prev => ({ ...prev, [member.clientId]: member.data }));
    });

    // Enter with joinedAt so host election can sort by timestamp
    channel.presence.enter({ name: playerName, color: myColor, joinedAt });

    // Hydrate existing players on first connect
    channel.presence.get((err, members) => {
      if (!err && members) {
        const map = {};
        members.forEach(m => { map[m.clientId] = m.data; });
        setPlayers(map);
      }
    });

    return () => {
      channel.presence.leave();
      channel.unsubscribe();
      client.close();
      setConnected(false);
    };
  }, [roomId, playerId, playerName, myColor, joinedAt]);

  // publish: always attaches senderId so receivers can filter their own events
  const publish = useCallback((eventName, data) => {
    if (!channelRef.current) return;
    channelRef.current.publish(eventName, { ...data, senderId: playerId });
  }, [playerId]);

  const updatePresence = useCallback((data) => {
    channelRef.current?.presence.update(data);
  }, []);

  return { connected, players, publish, updatePresence, myColor };
}
