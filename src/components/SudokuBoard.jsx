// ─── SudokuBoard.jsx ──────────────────────────────────────────────────────
import { useCallback } from 'react';
import { getRelatedCells, isCellCorrect } from '../lib/sudoku';

const BOX_BORDERS = (index) => {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const classes = [];
  if (col % 3 === 0 && col !== 0) classes.push('border-l-[2.5px]');
  if (row % 3 === 0 && row !== 0) classes.push('border-t-[2.5px]');
  return classes.join(' ');
};

export default function SudokuBoard({
  givens,
  board,
  solution,
  selected,
  onSelect,
  onInput,
  remoteCursors, // { [playerId]: { index, color, name } }
  myPlayerId,
}) {
  const related = selected !== null ? getRelatedCells(selected) : new Set();
  const sameValue = selected !== null && board[selected] !== 0
    ? board[selected]
    : null;

  const handleKey = useCallback((e, index) => {
    if (givens[index] !== 0) return;
    if (e.key >= '1' && e.key <= '9') {
      onInput(index, parseInt(e.key));
    } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
      onInput(index, 0);
    } else if (e.key === 'ArrowRight') onSelect(Math.min(80, index + 1));
    else if (e.key === 'ArrowLeft')  onSelect(Math.max(0, index - 1));
    else if (e.key === 'ArrowDown')  onSelect(Math.min(80, index + 9));
    else if (e.key === 'ArrowUp')    onSelect(Math.max(0, index - 9));
  }, [givens, onInput, onSelect]);

  return (
    <div
      className="relative select-none"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(9, 1fr)',
        border: '3px solid var(--ink)',
        borderRadius: '2px',
        width: 'min(504px, 92vw)',
        height: 'min(504px, 92vw)',
        boxShadow: '6px 6px 0 var(--ink)',
        background: 'var(--cream)',
      }}
    >
      {board.map((value, index) => {
        const isGiven = givens[index] !== 0;
        const isSelected = selected === index;
        const isRelated = related.has(index);
        const correct = isCellCorrect(value, solution, index);
        const sameVal = sameValue && value === sameValue && value !== 0;

        // Remote cursors on this cell
        const remotesHere = Object.entries(remoteCursors || {})
          .filter(([pid, cur]) => cur.index === index && pid !== myPlayerId);

        const bgColor = isSelected
          ? 'rgba(201,168,76,0.28)'
          : isRelated
          ? 'rgba(201,168,76,0.10)'
          : sameVal
          ? 'rgba(201,168,76,0.18)'
          : 'transparent';

        const textColor = isGiven
          ? 'var(--ink)'
          : correct === false
          ? 'var(--rust)'
          : correct === true
          ? 'var(--sage)'
          : '#555';

        return (
          <div
            key={index}
            tabIndex={isGiven ? -1 : 0}
            className={`sudoku-cell relative flex items-center justify-center cursor-pointer
              border border-[#c8c0b0]
              ${BOX_BORDERS(index)}
              ${isSelected ? 'selected' : ''}
              ${isGiven ? 'given' : ''}
              focus:outline-none`}
            style={{ background: bgColor }}
            onClick={() => onSelect(index)}
            onKeyDown={(e) => handleKey(e, index)}
          >
            {/* Remote player cursors */}
            {remotesHere.map(([pid, cur]) => (
              <span
                key={pid}
                className="absolute top-0 right-0 w-2 h-2 rounded-full z-10"
                style={{ background: cur.color }}
                title={cur.name}
              />
            ))}

            {/* Cell value */}
            {value !== 0 && (
              <span
                className={`number-pop font-mono text-center leading-none
                  ${isGiven ? 'font-[500]' : 'font-[300]'}`}
                style={{
                  fontSize: 'min(26px, 5vw)',
                  color: textColor,
                  letterSpacing: '-0.02em',
                }}
              >
                {value}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
