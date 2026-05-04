// ─── components/Players.jsx ───────────────────────────────────────────────
import { COLORS } from '../hooks/useRoom';

export default function Players({ players, myPlayerId, connected }) {
  const entries = Object.entries(players);
  return (
    <div className="players-root">
      <div className="players-header">
        <p className="section-label" style={{ margin: 0 }}>Игроки</p>
        <span className={`conn-pill${connected ? ' online' : ' offline'}`}>
          <span className="conn-dot" />
          {connected ? 'онлайн' : 'нет связи'}
        </span>
      </div>
      <div className="players-list">
        {entries.length === 0 && <p className="players-empty">Подключение…</p>}
        {entries.map(([pid, data]) => {
          const isMe   = pid === myPlayerId;
          const color  = COLORS[data?.color]?.fill  ?? '#888';
          const label  = COLORS[data?.color]?.label ?? '—';
          return (
            <div key={pid} className={`player-card${isMe ? ' me' : ''}`}>
              <span className="player-dot" style={{ background: color }} />
              <span className="player-name">{data?.name ?? 'Игрок'}</span>
              <span className="player-color" style={{ color }}>{label}</span>
              {isMe && <span className="player-you">ты</span>}
            </div>
          );
        })}
        {entries.length === 1 && (
          <p className="waiting-msg">⏳ Ожидание второго игрока…</p>
        )}
      </div>
    </div>
  );
}
