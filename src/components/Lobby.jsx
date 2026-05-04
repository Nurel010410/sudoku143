// ─── components/Lobby.jsx ─────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { generateRoomId } from '../lib/sudoku';

export default function Lobby({ onJoin, initialRoom }) {
  const [name,      setName]      = useState('');
  const [roomInput, setRoomInput] = useState(initialRoom || '');
  const [mode,      setMode]      = useState(initialRoom ? 'join' : 'create');
  const [error,     setError]     = useState('');

  useEffect(() => {
    if (initialRoom) { setRoomInput(initialRoom); setMode('join'); }
  }, [initialRoom]);

  const submit = () => {
    const n = name.trim();
    if (!n) { setError('Введи своё имя'); return; }
    if (mode === 'create') {
      onJoin(generateRoomId(), n);
    } else {
      const r = roomInput.trim().toUpperCase();
      if (r.length < 4) { setError('Введи код комнаты'); return; }
      onJoin(r, n);
    }
  };

  return (
    <div className="lobby-root">
      <div className="lobby-card">

        <div className="lobby-logo">Collab<span className="gold">Sudoku</span></div>
        <p className="lobby-sub">Совместное судоку в реальном времени</p>

        <div className="field">
          <label className="field-label">Твоё имя</label>
          <input
            className="field-input"
            placeholder="Например: Маша"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            maxLength={24}
            autoFocus
          />
        </div>

        <div className="mode-tabs">
          <button className={`mode-tab${mode === 'create' ? ' active' : ''}`}
            onClick={() => { setMode('create'); setError(''); }}>
            + Создать комнату
          </button>
          <button className={`mode-tab${mode === 'join' ? ' active' : ''}`}
            onClick={() => { setMode('join'); setError(''); }}>
            → Войти по коду
          </button>
        </div>

        {mode === 'join' && (
          <div className="field">
            <label className="field-label">Код комнаты</label>
            <input
              className="field-input upper mono"
              placeholder="Например: A3F8K2"
              value={roomInput}
              onChange={e => { setRoomInput(e.target.value.toUpperCase()); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && submit()}
              maxLength={8}
            />
          </div>
        )}

        {error && <p className="lobby-error">{error}</p>}

        <button className="btn-primary" onClick={submit}>
          {mode === 'create' ? 'Создать и начать' : 'Присоединиться'}
        </button>

        {mode === 'create' && (
          <p className="lobby-hint">
            После входа нажми <strong>«🔗 Пригласить друга»</strong> — скопируй ссылку
            и отправь другу. Он откроет её и сразу окажется в твоей комнате.
          </p>
        )}
      </div>

      <p className="lobby-footer">Работает на Supabase Realtime · без серверов · бесплатно</p>
    </div>
  );
}
