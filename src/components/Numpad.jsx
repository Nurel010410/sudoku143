// ─── components/Numpad.jsx ────────────────────────────────────────────────
export default function Numpad({ onInput, disabled }) {
  return (
    <div className="numpad-root">
      <p className="section-label">Цифры</p>
      <div className="numpad-grid">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} className="np-btn" disabled={disabled} onClick={() => onInput(n)}>{n}</button>
        ))}
        <button className="np-btn np-del" disabled={disabled} onClick={() => onInput(0)} title="Удалить">✕</button>
      </div>
    </div>
  );
}
