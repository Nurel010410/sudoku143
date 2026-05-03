// ─── Numpad.jsx ───────────────────────────────────────────────────────────
export default function Numpad({ onInput, disabled }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
        Цифры
      </p>
      <div className="grid grid-cols-5 gap-1.5">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button
            key={n}
            disabled={disabled}
            onClick={() => onInput(n)}
            className="font-mono text-base font-medium rounded-sm transition-all
              border border-[#c8c0b0] hover:border-[var(--gold)]
              active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              width: 38, height: 38,
              background: 'var(--cream)',
              color: 'var(--ink)',
            }}
          >
            {n}
          </button>
        ))}
        <button
          disabled={disabled}
          onClick={() => onInput(0)}
          className="font-mono text-sm rounded-sm transition-all col-span-1
            border border-[#c8c0b0] hover:border-[var(--rust)] hover:text-[var(--rust)]
            active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ width: 38, height: 38, background: 'var(--cream)', color: 'var(--muted)' }}
          title="Удалить"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
