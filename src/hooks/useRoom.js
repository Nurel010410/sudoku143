// ─── hooks/useRoom.js ─────────────────────────────────────────────────────
//
// КАК РАБОТАЕТ СИНХРОНИЗАЦИЯ (без Ably):
// ─────────────────────────────────────
// Supabase Realtime поддерживает «Broadcast» каналы — это чистые
// WebSocket-сообщения (pub/sub), не требующие таблиц в БД.
//
// Канал: `room:<roomId>`
// События:
//   • cell-update  — игрок поставил/удалил цифру
//   • cursor-move  — игрок переместил курсор
//   • chat         — сообщение в чат
//   • board-sync   — хост шлёт полный снимок доски новому игроку
//   • presence     — онлайн-список игроков (встроен в Supabase)
//
// Хост = первый по времени join. Когда кто-то новый появляется в presence,
// хост автоматически шлёт board-sync с текущим состоянием доски.

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

// Синий = создатель, Красный = второй игрок
export const COLORS = {
  blue: { fill: '#2563eb', label: 'Синий' },
  red:  { fill: '#dc2626', label: 'Красный' },
};

export function useRoom({ roomId, playerId, playerName, onEvent, getBoardSnapshot }) {
  const channelRef         = useRef(null);
  const onEventRef         = useRef(onEvent);
  const getBoardSnapshotRef = useRef(getBoardSnapshot);
  onEventRef.current         = onEvent;
  getBoardSnapshotRef.current = getBoardSnapshot;

  const [connected,   setConnected]   = useState(false);
  const [players,     setPlayers]     = useState({});   // { [playerId]: { name, color, joinedAt } }
  const [myColor,     setMyColor]     = useState('blue');

  // Стабильный момент входа
  const [joinedAt] = useState(() => Date.now());

  useEffect(() => {
    if (!roomId || !playerId) return;

    // ── Создаём канал ──────────────────────────────────────────────────
    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        broadcast: { self: false },  // НЕ получаем свои broadcast-события обратно
        presence:  { key: playerId },
      },
    });
    channelRef.current = channel;

    // ── Presence: список игроков в комнате ─────────────────────────────
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      // state = { [playerId]: [{ name, joinedAt, ... }] }
      const entries = Object.entries(state).map(([pid, arr]) => [pid, arr[0]]);

      // Назначаем цвета по порядку joinedAt
      const sorted = entries
        .filter(([, d]) => d?.joinedAt)
        .sort(([, a], [, b]) => a.joinedAt - b.joinedAt);

      const colorKeys = Object.keys(COLORS); // ['blue', 'red']
      const map = {};
      sorted.forEach(([pid, data], i) => {
        map[pid] = { ...data, color: colorKeys[i] ?? 'blue' };
      });
      setPlayers(map);

      // Определяем свой цвет
      const myIdx = sorted.findIndex(([pid]) => pid === playerId);
      setMyColor(colorKeys[myIdx] ?? 'blue');

      // Если я хост и появился новый игрок → шлю board-sync
      const isHost = sorted[0]?.[0] === playerId;
      if (isHost && sorted.length > 1) {
        const snap = getBoardSnapshotRef.current?.();
        if (snap) {
          channel.send({ type: 'broadcast', event: 'board-sync', payload: { board: snap, senderId: playerId } });
        }
      }
    });

    // ── Broadcast: входящие игровые события ───────────────────────────
    channel.on('broadcast', { event: 'cell-update' },  ({ payload }) => onEventRef.current?.('cell-update',  payload));
    channel.on('broadcast', { event: 'cursor-move' },  ({ payload }) => onEventRef.current?.('cursor-move',  payload));
    channel.on('broadcast', { event: 'chat' },         ({ payload }) => onEventRef.current?.('chat',         payload));
    channel.on('broadcast', { event: 'board-sync' },   ({ payload }) => onEventRef.current?.('board-sync',   payload));

    // ── Подключаемся и входим в presence ──────────────────────────────
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setConnected(true);
        await channel.track({ name: playerName, joinedAt, playerId });
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setConnected(false);
      }
    });

    return () => {
      channel.unsubscribe();
      setConnected(false);
    };
  }, [roomId, playerId, playerName, joinedAt]);

  // ── Отправка события ────────────────────────────────────────────────
  const send = useCallback((event, payload) => {
    channelRef.current?.send({ type: 'broadcast', event, payload: { ...payload, senderId: playerId } });
  }, [playerId]);

  return { connected, players, myColor, send };
}
