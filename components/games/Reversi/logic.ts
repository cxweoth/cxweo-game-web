// 黑白棋 — 純規則邏輯
//
// 不依賴 React;測試友好的純函式。
// 所有 helper 接收 board / player,回傳新值或 false。

import {
  CELLS,
  SIZE,
  inBounds,
  indexOf,
  opponent,
  rowCol,
  type Board,
  type Move,
  type Player,
} from './types';

const DIRS: ReadonlyArray<[number, number]> = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

export function createInitialBoard(): Board {
  const b: Board = new Array(CELLS).fill(0);
  // 標準起始:中心 4 子交叉
  b[indexOf(3, 3)] = 2;
  b[indexOf(3, 4)] = 1;
  b[indexOf(4, 3)] = 1;
  b[indexOf(4, 4)] = 2;
  return b;
}

/**
 * 檢查在 idx 落子,某方向能翻幾顆。回傳那一串會翻的棋子索引(不含落點)。
 * 規則:沿方向必須先連續一段對手色,然後遇到自己色;否則不合法。
 */
function flipsInDir(
  board: Board,
  idx: number,
  player: Player,
  dr: number,
  dc: number,
): number[] {
  const { row, col } = rowCol(idx);
  const opp = opponent(player);
  const path: number[] = [];
  let r = row + dr;
  let c = col + dc;
  while (inBounds(r, c)) {
    const cell = board[indexOf(r, c)];
    if (cell === opp) {
      path.push(indexOf(r, c));
    } else if (cell === player) {
      return path; // 找到夾子
    } else {
      return []; // 空格中斷
    }
    r += dr;
    c += dc;
  }
  return []; // 走到邊界都是對手色,沒夾住
}

/** 檢查單格是否為合法步;回傳合併後會翻的棋子(若有) */
export function legalAt(board: Board, idx: number, player: Player): number[] {
  if (board[idx] !== 0) return [];
  const flips: number[] = [];
  for (const [dr, dc] of DIRS) {
    const f = flipsInDir(board, idx, player, dr, dc);
    if (f.length > 0) flips.push(...f);
  }
  return flips;
}

export function legalMoves(board: Board, player: Player): Move[] {
  const moves: Move[] = [];
  for (let i = 0; i < CELLS; i++) {
    const flips = legalAt(board, i, player);
    if (flips.length > 0) moves.push({ index: i, flips });
  }
  return moves;
}

export function hasLegalMove(board: Board, player: Player): boolean {
  for (let i = 0; i < CELLS; i++) {
    if (board[i] !== 0) continue;
    // 找到一個就夠 — 不用全部找完
    for (const [dr, dc] of DIRS) {
      if (flipsInDir(board, i, player, dr, dc).length > 0) return true;
    }
  }
  return false;
}

/** 落子 + 翻棋。回傳新 board(immutable) */
export function applyMove(board: Board, move: Move, player: Player): Board {
  const next = board.slice();
  next[move.index] = player;
  for (const f of move.flips) next[f] = player;
  return next;
}

export function countStones(board: Board): { black: number; white: number; empty: number } {
  let black = 0;
  let white = 0;
  let empty = 0;
  for (const c of board) {
    if (c === 1) black++;
    else if (c === 2) white++;
    else empty++;
  }
  return { black, white, empty };
}

/** 雙方都沒合法步 → 棋局結束。回傳贏家(0=和局) */
export function checkWinner(board: Board): { gameOver: boolean; winner: 0 | 1 | 2 } {
  if (hasLegalMove(board, 1) || hasLegalMove(board, 2)) {
    return { gameOver: false, winner: 0 };
  }
  const { black, white } = countStones(board);
  if (black > white) return { gameOver: true, winner: 1 };
  if (white > black) return { gameOver: true, winner: 2 };
  return { gameOver: true, winner: 0 };
}

/**
 * 落完一手後的下一個輪到誰:對手有合法步 → 對手;對手沒步 → 自己再下一手;
 * 若兩邊都沒步 → 回傳 null(由呼叫端判結束)。
 */
export function nextTurn(board: Board, player: Player): Player | null {
  const opp = opponent(player);
  if (hasLegalMove(board, opp)) return opp;
  if (hasLegalMove(board, player)) return player;
  return null;
}

export { SIZE };
