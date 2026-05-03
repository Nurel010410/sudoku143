// ─── Sudoku puzzle generator & validator ──────────────────────────────────

const PUZZLES = [
  {
    givens: "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
    solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
  },
  {
    givens: "200080300060070084030500209000105408000000000402706000301007040720040060004010003",
    solution: "247981356169273584538564219976125438851349762423786951395617842712498663684132795",
  },
  {
    givens: "000000907000420180000705026100904000050000040000507009920108000034059000507000000",
    solution: "361348957275429183489715326147984235653271849892563714926138572734952618518647392",
  },
  {
    givens: "060050090007040005000006300400390001080000060100024007009700000300080700050010040",
    solution: "362158794897342615415976382472395861983617264156824937249761853631589742578432149",
  },
  {
    givens: "800000000003600000070090200060005300004000030000300070200060800500009000000080097",
    solution: "812753649943682175675491238468135792157924836239368471324617958791845623586279314",
  },
];

export function getRandomPuzzle() {
  const p = PUZZLES[Math.floor(Math.random() * PUZZLES.length)];
  return {
    givens: p.givens.split('').map(Number),
    solution: p.solution.split('').map(Number),
  };
}

export function getPuzzleById(id) {
  const idx = parseInt(id, 36) % PUZZLES.length;
  const p = PUZZLES[isNaN(idx) ? 0 : idx];
  return {
    givens: p.givens.split('').map(Number),
    solution: p.solution.split('').map(Number),
  };
}

export function isCellCorrect(value, solution, index) {
  if (!value || value === 0) return null; // empty
  return value === solution[index];
}

export function isBoardComplete(board, solution) {
  return board.every((val, i) => val === solution[i]);
}

export function getRelatedCells(index) {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  const related = new Set();

  for (let i = 0; i < 9; i++) {
    related.add(row * 9 + i);   // same row
    related.add(i * 9 + col);   // same col
  }
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      related.add(r * 9 + c);
    }
  }
  related.delete(index);
  return related;
}

export function generateRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function getPuzzleIndexForRoom(roomId) {
  let hash = 0;
  for (const ch of roomId) hash = (hash * 31 + ch.charCodeAt(0)) % PUZZLES.length;
  return hash;
}

export function getPuzzleForRoom(roomId) {
  const idx = getPuzzleIndexForRoom(roomId);
  const p = PUZZLES[idx];
  return {
    givens: p.givens.split('').map(Number),
    solution: p.solution.split('').map(Number),
  };
}
