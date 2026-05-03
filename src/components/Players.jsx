// ─── Players.jsx ──────────────────────────────────────────────────────────
export default function Players({ players, myPlayerId, connected }) {
  const entries = Object.entries(players);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          Игроки
        </p>
        <span
          className="flex items-center gap-1 text-xs font-mono"
          style={{ color: connected ? 'var(--sage)' : 'var(--rust)' }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: connected ? 'var(--sage)' : 'var(--rust)',
              animation: connected ? 'pulse 2s ease infinite' : 'none' }}
          />
          {connected ? 'онлайн' : 'нет связи'}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {entries.length === 0 && (
          <p className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
            Подключение…
          </p>
        )}
        {entries.map(([pid, data]) => {
          const isMe = pid === myPlayerId;
          const color = data?.color || '#a0aec0';
          const name  = data?.name || 'Игрок';
          return (
            <div
              key={pid}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-sm"
              style={{
                background: isMe ? 'rgba(201,168,76,0.12)' : 'var(--cream)',
                border: `1px solid ${isMe ? 'var(--gold)' : '#d4ccc0'}`,
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: color }}
              />
              <span className="text-sm truncate" style={{ color: 'var(--ink)' }}>
                {name}
              </span>
              {isMe && (
                <span className="ml-auto text-[10px] uppercase tracking-wider"
                  style={{ color: 'var(--muted)' }}>ты</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
