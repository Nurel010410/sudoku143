// ─── App.jsx ──────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import Lobby from './components/Lobby';
import Game from './components/Game';

function generatePlayerId() {
  return 'player_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
}

export default function App() {
  const [screen, setScreen] = useState('lobby'); // 'lobby' | 'game'
  const [roomId, setRoomId]   = useState(null);
  const [playerName, setPlayerName] = useState('');
  
  // Guaranteed unique and stable per tab
  const [playerId] = useState(() => generatePlayerId());

  // ── Read ?room=XXXX from URL on load ──────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setRoomId(room.toUpperCase());
      // Pre-fill room into lobby — user still needs to enter name
    }
  }, []);

  const handleJoin = (room, name) => {
    setRoomId(room);
    setPlayerName(name);
    setScreen('game');

    // Put room ID into URL so the browser back button works
    // and the user can copy the link from address bar
    const url = new URL(window.location.href);
    url.searchParams.set('room', room);
    window.history.pushState({}, '', url.toString());
  };

  const handleLeave = () => {
    setScreen('lobby');
    setRoomId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.pushState({}, '', url.toString());
  };

  if (screen === 'game' && roomId) {
    return (
      <Game
        roomId={roomId}
        playerId={playerId}
        playerName={playerName}
        onLeave={handleLeave}
      />
    );
  }

  return <Lobby onJoin={handleJoin} initialRoom={roomId} />;
}
