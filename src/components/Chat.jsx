// ─── Chat.jsx ─────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react';

export default function Chat({ messages, onSend, myPlayerId }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <div className="flex flex-col gap-2 flex-1 min-h-0">
      <p className="text-xs uppercase tracking-widest flex-shrink-0" style={{ color: 'var(--muted)' }}>
        Чат
      </p>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1 min-h-0"
        style={{ maxHeight: 180 }}
      >
        {messages.length === 0 && (
          <p className="text-xs font-mono italic" style={{ color: 'var(--muted)' }}>
            Пока пусто…
          </p>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.playerId === myPlayerId;
          return (
            <div key={i} className={`chat-msg flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && (
                <span className="text-[10px] mb-0.5 font-mono" style={{ color: 'var(--muted)' }}>
                  {msg.name}
                </span>
              )}
              <div
                className="px-2.5 py-1 rounded-sm text-sm max-w-[90%] break-words"
                style={{
                  background: isMe ? 'var(--gold)' : 'var(--cream)',
                  color: isMe ? '#fff' : 'var(--ink)',
                  border: `1px solid ${isMe ? 'var(--gold)' : '#d4ccc0'}`,
                  fontSize: 13,
                }}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-1.5 flex-shrink-0">
        <input
          className="flex-1 text-sm px-2.5 py-1.5 rounded-sm font-mono
            border border-[#c8c0b0] focus:outline-none focus:border-[var(--gold)]"
          style={{ background: 'var(--cream)', color: 'var(--ink)' }}
          placeholder="Сообщение…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          maxLength={120}
        />
        <button
          onClick={send}
          className="px-3 py-1.5 text-sm font-medium rounded-sm transition-all active:scale-95
            hover:opacity-90"
          style={{ background: 'var(--gold)', color: '#fff' }}
        >
          →
        </button>
      </div>
    </div>
  );
}
