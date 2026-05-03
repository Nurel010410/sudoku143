// ─── Lobby.jsx ────────────────────────────────────────────────────────────
import { useState } from 'react';
import { generateRoomId } from '../lib/sudoku';

export default function Lobby({ onJoin }) {
  const [name, setName] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [mode, setMode] = useState('create'); // 'create' | 'join'
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimName = name.trim();
    if (!trimName) { setError('Введи своё имя'); return; }

    if (mode === 'create') {
      const roomId = generateRoomId();
      onJoin(roomId, trimName);
    } else {
      const trimRoom = roomInput.trim().toUpperCase();
      if (trimRoom.length < 4) { setError('Введи ID комнаты'); return; }
      onJoin(trimRoom, trimName);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--paper)' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <h1
            className="text-5xl font-extrabold tracking-tighter mb-2"
            style={{ fontFamily: 'Syne', color: 'var(--ink)', letterSpacing: '-0.05em' }}
          >
            Collab<span style={{ color: 'var(--gold)' }}>Sudoku</span>
          </h1>
          <p className="text-sm font-mono" style={{ color: 'var(--muted)' }}>
            Решайте вместе — в реальном времени
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-sm p-7 flex flex-col gap-5"
          style={{
            background: 'var(--cream)',
            border: '2px solid var(--ink)',
            boxShadow: '6px 6px 0 var(--ink)',
          }}
        >
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              Твоё имя
            </label>
            <input
              className="w-full px-3 py-2.5 rounded-sm font-mono text-sm border
                focus:outline-none focus:border-[var(--gold)] transition-colors"
              style={{ background: 'var(--paper)', borderColor: '#c8c0b0', color: 'var(--ink)' }}
              placeholder="Например: Маша"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              maxLength={24}
              autoFocus
            />
          </div>

          {/* Mode tabs */}
          <div className="flex rounded-sm overflow-hidden border" style={{ borderColor: '#c8c0b0' }}>
            {['create', 'join'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className="flex-1 py-2 text-sm font-medium transition-all"
                style={{
                  background: mode === m ? 'var(--gold)' : 'var(--paper)',
                  color: mode === m ? '#fff' : 'var(--muted)',
                  fontFamily: 'Syne',
                }}
              >
                {m === 'create' ? '+ Создать комнату' : '→ Войти в комнату'}
              </button>
            ))}
          </div>

          {/* Room input (join mode) */}
          {mode === 'join' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                ID комнаты
              </label>
              <input
                className="w-full px-3 py-2.5 rounded-sm font-mono text-sm border uppercase
                  focus:outline-none focus:border-[var(--gold)] transition-colors"
                style={{ background: 'var(--paper)', borderColor: '#c8c0b0', color: 'var(--ink)', letterSpacing: '0.1em' }}
                placeholder="например: A3F8K2"
                value={roomInput}
                onChange={e => { setRoomInput(e.target.value.toUpperCase()); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                maxLength={8}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm font-mono" style={{ color: 'var(--rust)' }}>{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-sm font-bold text-base tracking-wide transition-all
              hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'var(--ink)', color: 'var(--paper)', fontFamily: 'Syne' }}
          >
            {mode === 'create' ? 'Создать и начать' : 'Присоединиться'}
          </button>

          {/* Info */}
          <p className="text-xs text-center font-mono" style={{ color: 'var(--muted)' }}>
            После создания комнаты поделись ссылкой с другом —<br />
            он откроет её и вы начнёте решать вместе.
          </p>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs mt-6 font-mono" style={{ color: '#c0b8ac' }}>
          Работает на Ably · без серверов · бесплатно
        </p>
      </div>
    </div>
  );
}
