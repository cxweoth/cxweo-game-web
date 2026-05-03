// 連線四子 — 純規則邏輯
//
// 不依賴 React;測試友好的純函式。

import { CELLS, COLS, ROWS, WIN, indexOf, type Board, type Player } from './types';

export function createEmptyBoard(): Board {
  return new Array(CELLS).fill(0);
}

/** 找該欄最低的空格 row;滿了回傳 −1 */
export function lowestEmptyRow(board: Board, col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[indexOf(r, col)] === 0) return r;
  }
  return -1;
}

export function isColumnFull(board: Board, col: number): boolean {
  return lowestEmptyRow(board, col) === -1;
}

/** 把棋子掉到該欄;不合法回 null,合法回 {newBoard, landed:{row,col}} */
export function dropPiece(
  board: Board,
  col: number,
  player: Player,
): { board: Board; row: number } | null {
  const r = lowestEmptyRow(board, col);
  if (r === -1) return null;
  const next = board.slice();
  next[indexOf(r, col)] = player;
  return { board: next, row: r };
}

export function legalCols(board: Board): number[] {
  const cols: number[] = [];
  for (let c = 0; c < COLS; c++) {
    if (!isColumnFull(board, c)) cols.push(c);
  }
  return cols;
}

const DIRS: ReadonlyArray<[number, number]> = [
  [0, 1], // 橫
  [1, 0], // 直
  [1, 1], // 主對角(右下)
  [1, -1], // 反對角(左下)
];

/**
 * 從 (row, col) 出發,某方向是否能找到 4 連同色。
 * 若有,回傳那 4 個格子的 index;否則 null。
 */
function checkLine(
  board: Board,
  row: number,
  col: number,
  dr: number,
  dc: number,
): number[] | null {
  const player = board[indexOf(row, col)];
  if (!player) return null;
  const out: number[] = [indexOf(row, col)];
  for (let k = 1; k < WIN; k++) {
    const r = row + dr * k;
    const c = col + dc * k;
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
    if (board[indexOf(r, c)] !== player) return null;
    out.push(indexOf(r, c));
  }
  return out;
}

/** 全盤掃 4 連;回傳 {winner, line} 或 null */
export function findWin(
  board: Board,
): { winner: Player; line: number[] } | null {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[indexOf(r, c)] === 0) continue;
      for (const [dr, dc] of DIRS) {
        const line = checkLine(board, r, c, dr, dc);
        if (line) {
          return { winner: board[indexOf(r, c)] as Player, line };
        }
      }
    }
  }
  return null;
}

export function isDraw(board: Board): boolean {
  if (findWin(board)) return false;
  for (const c of board) if (c === 0) return false;
  return true;
}
