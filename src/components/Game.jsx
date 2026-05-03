// ─── components/Game.jsx ──────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAbly }            from '../hooks/useAbly';
import { getPuzzleForRoom, isBoardComplete } from '../lib/sudoku';
import SudokuBoard from './SudokuBoard';
import Numpad      from './Numpad';
import Players     from './Players';
import Chat        from './Chat';

const CURSOR_THROTTLE_MS = 80;

export default function Game({ roomId, playerId, playerName, onLeave }) {
  const { givens, solution } = useMemo(() => getPuzzleForRoom(roomId), [roomId]);

  const [board,         setBoard]         = useState(() => [...givens]);
  const [selected,      setSelected]      = useState(null);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [messages,      setMessages]      = useState([]);
  const [complete,      setComplete]      = useState(false);
  const [copied,        setCopied]        = useState(false);

  // boardRef always mirrors state — lets getBoardSnapshot read current board
  // without being listed in the useAbly dependency array.
  const boardRef = useRef(board);
  useEffect(() => { boardRef.current = board; }, [board]);

  // Stable callback: never changes identity → useAbly effect never re-runs.
  const getBoardSnapshot = useCallback(() => boardRef.current, []);

  const lastCursorPublish = useRef(0);

  // ── Inbound Ably events ────────────────────────────────────────────────
  // All state updates use the functional form of setState so this callback
  // never needs stale closure references — safe to keep stable with [givens].
  const handleEvent = useCallback((eventName, data) => {
    switch (eventName) {
      case 'cell-update':
        setBoard(prev => {
          if (prev[data.index] === data.value) return prev; // no-op guard
          const next = [...prev];
          next[data.index] = data.value;
          return next;
        });
        break;

      case 'cursor-move':
        setRemoteCursors(prev => {
          if (prev[data.playerId]?.index === data.index) return prev;
          return {
            ...prev,
            [data.playerId]: { index: data.index, color: data.color, name: data.name },
          };
        });
        break;

      case 'chat-message':
        setMessages(prev => [...prev, data]);
        break;

      case 'board-sync':
        // Unconditionally apply: late joiner board is always givens-only at
        // this point (they just joined). The host won't spam this — it only
        // fires once per enter event.
        if (data.board) {
          console.log('[Game] Received board-sync, applying state');
          setBoard(data.board);
        }
        break;

      default:
        break;
    }
  }, [givens]);

  const { connected, players, publish, myColor } = useAbly({
    roomId,
    playerId,
    playerName,
    onEvent:          handleEvent,
    getBoardSnapshot,
  });

  // ── Completion ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!complete && isBoardComplete(board, solution)) setComplete(true);
  }, [board, solution, complete]);

  // ── Cell input ─────────────────────────────────────────────────────────
  const handleInput = useCallback((index, value) => {
    if (givens[index] !== 0) return;
    setBoard(prev => {
      if (prev[index] === value) return prev;
      const next = [...prev];
      next[index] = value;
      return next;
    });
    publish('cell-update', { index, value });
  }, [givens, publish]);

  // ── Cell selection + cursor broadcast ─────────────────────────────────
  const handleSelect = useCallback((index) => {
    setSelected(index);
    const now = Date.now();
    if (now - lastCursorPublish.current < CURSOR_THROTTLE_MS) return;
    lastCursorPublish.current = now;
    publish('cursor-move', { playerId, index, color: myColor, name: playerName });
  }, [playerId, playerName, myColor, publish]);

  // ── Global keyboard handler ────────────────────────────────────────────
  // BUG FIX: previously checked for data-sudoku-board attribute that was
  // never placed on the board element, so keyboard events from the chat
  // input were incorrectly blocked. Now we explicitly check if the focused
  // element is an input/textarea and bail out in that case.
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (selected === null) return;

      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        handleInput(selected, parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        e.preventDefault();
        handleInput(selected, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault(); handleSelect(Math.min(80, selected + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault(); handleSelect(Math.max(0, selected - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault(); handleSelect(Math.min(80, selected + 9));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault(); handleSelect(Math.max(0, selected - 9));
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, handleInput, handleSelect]);

  // ── Chat ───────────────────────────────────────────────────────────────
  const sendChat = useCallback((text) => {
    const msg = { playerId, name: playerName, text, ts: Date.now() };
    setMessages(prev => [...prev, msg]);
    publish('chat-message', msg);
  }, [playerId, playerName, publish]);

  // ── Invite link ────────────────────────────────────────────────────────
  const copyLink = useCallback(() => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [roomId]);

  // ── Progress ───────────────────────────────────────────────────────────
  const { filledCount, totalEmpty, progress } = useMemo(() => {
    const filled = board.filter((v, i) => v !== 0 && givens[i] === 0).length;
    const empty  = givens.filter(v => v === 0).length;
    return { filledCount: filled, totalEmpty: empty, progress: empty > 0 ? Math.round((filled / empty) * 100) : 0 };
  }, [board, givens]);

  const handleNumpadInput = useCallback((v) => {
    if (selected !== null) handleInput(selected, v);
  }, [selected, handleInput]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--paper)' }}>
      {/* TOP BAR */}
      <header className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: '#d4ccc0' }}>
        <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Syne', letterSpacing: '-0.03em' }}>
          Collaborative<span style={{ color: 'var(--gold)' }}> Sudoku</span>
        </h1>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <div className="font-mono text-xs px-2 py-1 rounded-sm border"
            style={{ background: 'var(--cream)', borderColor: '#c8c0b0', color: 'var(--muted)' }}>
            Комната: <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{roomId}</span>
          </div>
          <button onClick={copyLink}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm font-medium transition-all active:scale-95 border"
            style={{ background: copied ? 'var(--sage)' : 'var(--gold)', color: '#fff', borderColor: copied ? 'var(--sage)' : 'var(--gold)' }}>
            {copied ? '✓ Скопировано!' : '🔗 Пригласить друга'}
          </button>
          {onLeave && (
            <button onClick={onLeave}
              className="text-xs px-3 py-1.5 rounded-sm border transition-all active:scale-95"
              style={{ borderColor: '#c8c0b0', color: 'var(--muted)', background: 'transparent' }}>
              ← Выйти
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-4 lg:p-6 max-w-6xl mx-auto w-full">
        {/* BOARD AREA */}
        <div className="flex flex-col items-center gap-4 flex-1">
          {/* Progress */}
          <div className="w-full max-w-[504px]">
            <div className="flex justify-between text-xs font-mono mb-1.5" style={{ color: 'var(--muted)' }}>
              <span>Прогресс команды</span>
              <span style={{ color: progress === 100 ? 'var(--sage)' : 'var(--ink)' }}>
                {filledCount}/{totalEmpty} — {progress}%
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#e0d8cc' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: progress === 100 ? 'var(--sage)' : 'var(--gold)' }} />
            </div>
          </div>

          <div className={complete ? 'complete-glow rounded' : ''}>
            <SudokuBoard
              givens={givens}
              board={board}
              solution={solution}
              selected={selected}
              onSelect={handleSelect}
              onInput={handleInput}
              remoteCursors={remoteCursors}
              myPlayerId={playerId}
            />
          </div>

          {complete && (
            <div className="w-full max-w-[504px] text-center py-3 rounded-sm font-bold text-lg tracking-wide flex flex-col gap-1"
              style={{ background: 'var(--sage)', color: '#fff', fontFamily: 'Syne' }}>
              <span>🎉 Судоку решено! Вы молодцы!</span>
              <span className="text-sm font-medium opacity-90">Этот проект был создан для Акылай</span>
            </div>
          )}

          <div className="lg:hidden">
            <Numpad onInput={handleNumpadInput} disabled={selected === null} />
          </div>
        </div>

        {/* SIDEBAR */}
        <aside className="flex flex-col gap-5 lg:w-64 xl:w-72">
          <div className="hidden lg:block">
            <Numpad onInput={handleNumpadInput} disabled={selected === null} />
          </div>
          <div className="border-t hidden lg:block" style={{ borderColor: '#d4ccc0' }} />
          <Players players={players} myPlayerId={playerId} connected={connected} />
          <div className="border-t" style={{ borderColor: '#d4ccc0' }} />
          <Chat messages={messages} onSend={sendChat} myPlayerId={playerId} />
          <div className="border-t pt-4" style={{ borderColor: '#d4ccc0' }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>Легенда</p>
            <div className="flex flex-col gap-1 text-xs font-mono" style={{ color: 'var(--slate)' }}>
              <span><span style={{ color: 'var(--ink)', fontWeight: 500 }}>Чёрный</span> — данное число</span>
              <span><span style={{ color: 'var(--sage)' }}>Зелёный</span> — правильный ввод</span>
              <span><span style={{ color: 'var(--rust)' }}>Красный</span> — ошибка</span>
              <span>● Точка в углу — курсор партнёра</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
