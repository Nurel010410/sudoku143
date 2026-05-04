// ─── components/Game.jsx ──────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRoom, COLORS }        from '../hooks/useRoom';
import { getPuzzleForRoom, isBoardComplete, isCellCorrect, getRelatedCells, makeBoard } from '../lib/sudoku';
import Numpad  from './Numpad';
import Players from './Players';
import Chat    from './Chat';

const THROTTLE = 80; // мс между событиями курсора

export default function Game({ roomId, playerId, playerName, onLeave }) {
  const { givens, solution } = useMemo(() => getPuzzleForRoom(roomId), [roomId]);

  // Доска: массив из 81 объектов { value, owner, isGiven }
  const [board,        setBoard]        = useState(() => makeBoard(givens));
  const [selected,     setSelected]     = useState(null);
  const [remoteCursor, setRemoteCursor] = useState(null); // { index, color }
  const [messages,     setMessages]     = useState([]);
  const [complete,     setComplete]     = useState(false);
  const [copied,       setCopied]       = useState(false);

  // Ref для снимка доски (передаём в useRoom для board-sync)
  const boardRef = useRef(board);
  useEffect(() => { boardRef.current = board; }, [board]);
  const getBoardSnapshot = useCallback(() => boardRef.current, []);

  const cursorRef = useRef(0);

  // ── Входящие события от партнёра ──────────────────────────────────────
  const handleEvent = useCallback((event, data) => {
    switch (event) {
      case 'cell-update':
        setBoard(prev => {
          const next = [...prev];
          next[data.index] = { ...next[data.index], value: data.value, owner: data.owner };
          return next;
        });
        break;

      case 'cursor-move':
        setRemoteCursor({ index: data.index, color: data.color });
        break;

      case 'chat':
        setMessages(prev => [...prev, data]);
        break;

      case 'board-sync':
        // Применяем снимок доски от хоста (только если наша доска ещё чистая)
        if (Array.isArray(data.board)) {
          setBoard(prev => {
            const hasMyMoves = prev.some(c => !c.isGiven && c.value !== 0);
            if (hasMyMoves) return prev; // уже что-то поставили — не перезаписываем
            return data.board.map((c, i) => ({ ...c, isGiven: givens[i] !== 0 }));
          });
        }
        break;
    }
  }, [givens]);

  const { connected, players, myColor, send } = useRoom({
    roomId, playerId, playerName,
    onEvent: handleEvent,
    getBoardSnapshot,
  });

  // ── Проверка победы ────────────────────────────────────────────────────
  useEffect(() => {
    if (!complete && isBoardComplete(board, solution)) setComplete(true);
  }, [board, solution, complete]);

  // ── Ввод цифры ─────────────────────────────────────────────────────────
  const handleInput = useCallback((index, value) => {
    if (board[index]?.isGiven) return;
    const owner = value === 0 ? null : myColor;
    setBoard(prev => {
      const next = [...prev];
      next[index] = { ...next[index], value, owner };
      return next;
    });
    send('cell-update', { index, value, owner });
  }, [board, myColor, send]);

  // ── Выбор клетки ───────────────────────────────────────────────────────
  const handleSelect = useCallback((index) => {
    setSelected(index);
    const now = Date.now();
    if (now - cursorRef.current < THROTTLE) return;
    cursorRef.current = now;
    send('cursor-move', { index, color: myColor });
  }, [myColor, send]);

  // ── Глобальные горячие клавиши ─────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (selected === null) return;
      const nav = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 9, ArrowUp: -9 };
      if (nav[e.key] !== undefined) {
        e.preventDefault();
        handleSelect(Math.max(0, Math.min(80, selected + nav[e.key])));
      } else if (e.key >= '1' && e.key <= '9') {
        e.preventDefault(); handleInput(selected, +e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        e.preventDefault(); handleInput(selected, 0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, handleInput, handleSelect]);

  // ── Чат ────────────────────────────────────────────────────────────────
  const sendChat = useCallback((text) => {
    const msg = { playerId, name: playerName, text, ts: Date.now(), color: myColor };
    setMessages(prev => [...prev, msg]);
    send('chat', msg);
  }, [playerId, playerName, myColor, send]);

  // ── Ссылка-приглашение ─────────────────────────────────────────────────
  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(`${location.origin}${location.pathname}?room=${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [roomId]);

  // ── Прогресс ───────────────────────────────────────────────────────────
  const progress = useMemo(() => {
    const filled = board.filter((c, i) => c.value !== 0 && givens[i] === 0).length;
    const total  = givens.filter(v => v === 0).length;
    return { filled, total, pct: total > 0 ? Math.round(filled / total * 100) : 0 };
  }, [board, givens]);

  // ── Подсветка клеток ───────────────────────────────────────────────────
  const related  = useMemo(() => selected !== null ? getRelatedCells(selected) : new Set(), [selected]);
  const selValue = selected !== null ? board[selected]?.value : null;

  return (
    <div className="g-root">

      {/* ── ШАПКА ── */}
      <header className="g-header">
        <span className="g-logo">Collab<span className="gold">Sudoku</span></span>
        <div className="g-header-right">
          <span className="room-chip">#{roomId}</span>
          <button className={`btn-invite${copied ? ' copied' : ''}`} onClick={copyLink}>
            {copied ? '✓ Скопировано' : '🔗 Пригласить друга'}
          </button>
          <button className="btn-leave" onClick={onLeave}>← Выйти</button>
        </div>
      </header>

      <div className="g-body">

        {/* ── ДОСКА ── */}
        <section className="board-section">

          {/* Прогресс */}
          <div className="prog-bar-wrap">
            <div className="prog-bar-labels">
              <span>Прогресс команды</span>
              <span style={{ color: progress.pct === 100 ? 'var(--sage)' : 'var(--ink)' }}>
                {progress.filled}/{progress.total} — {progress.pct}%
              </span>
            </div>
            <div className="prog-bar-track">
              <div className="prog-bar-fill" style={{
                width: `${progress.pct}%`,
                background: progress.pct === 100 ? 'var(--sage)' : 'var(--blue)',
              }} />
            </div>
          </div>

          {/* Сетка */}
          <div className={`sudoku-grid${complete ? ' victory-glow' : ''}`}>
            {board.map((cell, idx) => {
              const row     = Math.floor(idx / 9);
              const col     = idx % 9;
              const isSel   = selected === idx;
              const isRel   = related.has(idx);
              const isSame  = selValue && selValue !== 0 && cell.value === selValue;
              const correct = isCellCorrect(cell.value, solution, idx);
              const isRemote = remoteCursor?.index === idx;

              // Фон клетки
              let bg = 'transparent';
              if (isSel) bg = 'rgba(37,99,235,0.18)';
              else if (isRel) bg = 'rgba(37,99,235,0.07)';
              else if (isSame) bg = 'rgba(37,99,235,0.11)';

              // Цвет цифры
              let color = '#777';
              if (cell.isGiven) {
                color = 'var(--ink)';
              } else if (cell.value !== 0) {
                if (correct === false) color = '#eab308';   // неверная цифра - желтым
                else color = '#22c55e'; // верная цифра - зеленым
              }

              return (
                <div
                  key={idx}
                  className={`s-cell${isSel ? ' sel' : ''}${cell.isGiven ? ' given' : ''}`}
                  style={{
                    background: bg,
                    borderLeftWidth:  col % 3 === 0 && col !== 0 ? '2.5px' : '1px',
                    borderTopWidth:   row % 3 === 0 && row !== 0 ? '2.5px' : '1px',
                    borderColor: '#c8c0b0',
                    borderLeftColor:  col % 3 === 0 && col !== 0 ? 'var(--ink)' : '#c8c0b0',
                    borderTopColor:   row % 3 === 0 && row !== 0 ? 'var(--ink)' : '#c8c0b0',
                  }}
                  tabIndex={cell.isGiven ? -1 : 0}
                  onClick={() => handleSelect(idx)}
                  onKeyDown={e => {
                    if (e.key >= '1' && e.key <= '9') handleInput(idx, +e.key);
                    else if (e.key === 'Backspace' || e.key === 'Delete') handleInput(idx, 0);
                  }}
                >
                  {/* Курсор партнёра */}
                  {isRemote && (
                    <span className="cursor-dot" style={{ background: COLORS[remoteCursor.color]?.fill }} />
                  )}
                  {/* Цифра */}
                  {cell.value !== 0 && (
                    <span className={`cell-digit${cell.isGiven ? ' digit-given' : ' digit-player'}`} style={{ color }}>
                      {cell.value}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {complete && (
            <div className="victory-banner">🎉 Судоку решено! Отлично сыграно!</div>
          )}

          <div className="numpad-mobile"><Numpad onInput={v => selected !== null && handleInput(selected, v)} disabled={selected === null} /></div>
        </section>

        {/* ── САЙДБАР ── */}
        <aside className="g-sidebar">
          <div className="numpad-desktop"><Numpad onInput={v => selected !== null && handleInput(selected, v)} disabled={selected === null} /></div>
          <hr className="divider" />
          <Players players={players} myPlayerId={playerId} connected={connected} />
          <hr className="divider" />
          <Chat messages={messages} onSend={sendChat} myPlayerId={playerId} />
          <div className="legend">
            <p className="legend-title">Правила</p>
            <div className="legend-row"><span style={{ color: 'var(--ink)', fontWeight: 700 }}>●</span> Чёрный — задача (нельзя менять)</div>
            <div className="legend-row"><span style={{ color: '#22c55e' }}>●</span> Верная цифра</div>
            <div className="legend-row"><span style={{ color: '#eab308' }}>●</span> Неверная цифра</div>
            <div style={{ display: 'none' }}>это игра была создана для Акылай</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
