// 純粹的遊戲邏輯：碰撞、放置、消行、計分。
// 不持狀態（除了內部 helper）；所有狀態由 useTetris 拿著。

import { Bag, PIECE_SHAPES } from './pieces';
import { CFG, COLS, ROWS, type Board, type Cell, type Piece, type PieceType, type Rotation } from './types';

export function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null as Cell));
}

export function spawnPiece(type: PieceType): Piece {
  // 出生位置：對於 I 是 (3, -1)，其他是 (3, -2) 讓它從畫面外進來
  const x = type === 'I' || type === 'O' ? 3 : 3;
  const y = type === 'I' ? -1 : -2;
  return { type, x, y, rotation: 0 };
}

/** 取得 piece 在當前旋轉下,會佔用的絕對 (col, row) 列表 */
export function pieceCells(piece: Piece): Array<[number, number]> {
  const shape = PIECE_SHAPES[piece.type][piece.rotation]!;
  return shape.map(([dx, dy]) => [piece.x + dx, piece.y + dy] as [number, number]);
}

/** 給定的 piece 是否可以放置（不出界、不撞已固定方塊） */
export function isValid(board: Board, piece: Piece): boolean {
  for (const [c, r] of pieceCells(piece)) {
    if (c < 0 || c >= COLS || r >= ROWS) return false;
    if (r < 0) continue; // 上方隱藏區允許
    if (board[r]?.[c]) return false;
  }
  return true;
}

/** 嘗試平移；成功回傳新 piece，失敗回傳 null */
export function tryMove(board: Board, piece: Piece, dx: number, dy: number): Piece | null {
  const next: Piece = { ...piece, x: piece.x + dx, y: piece.y + dy };
  return isValid(board, next) ? next : null;
}

/** 嘗試旋轉（無 SRS 踢牆，撞到就拒絕） */
export function tryRotate(board: Board, piece: Piece, dir: 1 | -1): Piece | null {
  const r = (((piece.rotation + dir) % 4) + 4) % 4;
  const next: Piece = { ...piece, rotation: r as Rotation };
  return isValid(board, next) ? next : null;
}

/** 把 piece 鎖定到 board 上(回傳新 board) */
export function lockIn(board: Board, piece: Piece): Board {
  const next = board.map((row) => row.slice());
  for (const [c, r] of pieceCells(piece)) {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) next[r]![c] = piece.type;
  }
  return next;
}

/** 消除已填滿的列;回傳 { board, lines } */
export function clearLines(board: Board): { board: Board; lines: number } {
  const remaining = board.filter((row) => row.some((c) => c === null));
  const cleared = ROWS - remaining.length;
  if (cleared === 0) return { board, lines: 0 };
  const empty = Array.from({ length: cleared }, () =>
    Array.from({ length: COLS }, () => null as Cell),
  );
  return { board: [...empty, ...remaining], lines: cleared };
}

/** 計算「鬼影位置」(把 piece 一路下落到不能再下為止的位置) */
export function ghostPiece(board: Board, piece: Piece): Piece {
  let cur = piece;
  for (;;) {
    const next = tryMove(board, cur, 0, 1);
    if (!next) return cur;
    cur = next;
  }
}

/** 線數對應的計分(經典規則) */
export function lineScore(lines: number, level: number): number {
  const base = lines === 1 ? 100 : lines === 2 ? 300 : lines === 3 ? 500 : lines >= 4 ? 800 : 0;
  return base * level;
}

/** 等級對應的下落間隔(ms) */
export function dropInterval(level: number): number {
  return Math.max(80, Math.round(1000 * Math.pow(0.85, level - 1)));
}

/** Hard drop:把 piece 落到底,回傳新位置與下落格數 */
export function hardDrop(board: Board, piece: Piece): { piece: Piece; cells: number } {
  let cur = piece;
  let cells = 0;
  for (;;) {
    const next = tryMove(board, cur, 0, 1);
    if (!next) return { piece: cur, cells };
    cur = next;
    cells++;
  }
}

export { Bag };
