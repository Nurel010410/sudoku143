// ─── App.jsx ──────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import Lobby from './components/Lobby';
import Game  from './components/Game';

function mkId() {
  return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function App() {
  const [screen,  setScreen]  = useState('lobby');
  const [roomId,  setRoomId]  = useState(null);
  const [name,    setName]    = useState('');
  const [pid]                 = useState(mkId);

  useEffect(() => {
    const r = new URLSearchParams(location.search).get('room');
    if (r) setRoomId(r.toUpperCase());
  }, []);

  const handleJoin = (room, playerName) => {
    setRoomId(room); setName(playerName); setScreen('game');
    const u = new URL(location.href);
    u.searchParams.set('room', room);
    history.pushState({}, '', u);
  };

  const handleLeave = () => {
    setScreen('lobby'); setRoomId(null);
    const u = new URL(location.href);
    u.searchParams.delete('room');
    history.pushState({}, '', u);
  };

  if (screen === 'game' && roomId)
    return <Game roomId={roomId} playerId={pid} playerName={name} onLeave={handleLeave} />;

  return <Lobby onJoin={handleJoin} initialRoom={roomId} />;
}
