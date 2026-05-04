// ─── components/Chat.jsx ──────────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react';
import { COLORS } from '../hooks/useRoom';

function fmt(ts) {
  const d = new Date(ts);
  return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
}

export default function Chat({ messages, onSend, myPlayerId }) {
  const [text, setText]   = useState('');
  const bottomRef         = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div className="chat-root">
      <p className="section-label">Чат</p>

      <div className="chat-feed">
        {messages.length === 0 && (
          <p className="chat-empty">Напишите первое сообщение…</p>
        )}
        {messages.map((msg, i) => {
          const isMe  = msg.playerId === myPlayerId;
          const color = COLORS[msg.color]?.fill ?? '#888';
          return (
            <div key={i} className={`chat-row${isMe ? ' chat-me' : ' chat-them'}`}>
              {/* Аватар */}
              <div className="chat-avatar" style={{ background: color }}>
                {(msg.name || '?')[0].toUpperCase()}
              </div>

              <div className={`chat-bubble${isMe ? ' bubble-me' : ' bubble-them'}`}>
                {!isMe && <span className="chat-sender" style={{ color }}>{msg.name}</span>}
                <span className="chat-text">{msg.text}</span>
                <span className="chat-ts">{fmt(msg.ts)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="chat-compose">
        <input
          className="chat-input"
          placeholder="Сообщение…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          maxLength={200}
        />
        <button className="chat-send-btn" onClick={send} disabled={!text.trim()}>↑</button>
      </div>
    </div>
  );
}
