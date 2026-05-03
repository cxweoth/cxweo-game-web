// 15 Puzzle — 純函式邏輯
//
// 不持有狀態;所有 helper 都吃 board 回新的 board(或用 index 計算)。

import { CFG, type Board, type Direction } from './types';

const N = CFG.size;

export function createSolvedBoard(): Board {
  const b = Array.from({ length: CFG.cells }, (_, i) => (i + 1) % CFG.cells);
  // 1..15, 最後一格 0(空)
  return b;
}

export function isSolved(board: Board): boolean {
  for (let i = 0; i < CFG.cells - 1; i++) {
    if (board[i] !== i + 1) return false;
  }
  return board[CFG.cells - 1] === 0;
}

export function findEmpty(board: Board): number {
  return board.indexOf(0);
}

export function rowCol(idx: number): { row: number; col: number } {
  return { row: Math.floor(idx / N), col: idx % N };
}

/**
 * dir = 玩家輸入方向。語意:
 *   'up'   → 把空格下方的磚塊往「上」滑(空格往下)
 *   'down' → 把空格上方的磚塊往「下」滑
 *   'left' → 把空格右邊的磚塊往「左」滑
 *   'right'→ 把空格左邊的磚塊往「右」滑
 *
 * 觸控 swipe 用同一語意:swipe up = 把下方的磚拉上來。
 */
export function neighborToSwap(empty: number, dir: Direction): number | null {
  const { row, col } = rowCol(empty);
  switch (dir) {
    case 'up':
      return row < N - 1 ? empty + N : null;
    case 'down':
      return row > 0 ? empty - N : null;
    case 'left':
      return col < N - 1 ? empty + 1 : null;
    case 'right':
      return col > 0 ? empty - 1 : null;
  }
}

/** 直接點擊磚塊(必須與空格相鄰才合法)。回傳新 board 或 null。 */
export function tryClickTile(board: Board, tileIdx: number): Board | null {
  const empty = findEmpty(board);
  const { row: er, col: ec } = rowCol(empty);
  const { row: tr, col: tc } = rowCol(tileIdx);
  const adjacent = (er === tr && Math.abs(ec - tc) === 1) || (ec === tc && Math.abs(er - tr) === 1);
  if (!adjacent) return null;
  const next = board.slice();
  next[empty] = next[tileIdx]!;
  next[tileIdx] = 0;
  return next;
}

/** dir 移動。回傳新 board 或 null(撞牆) */
export function tryMove(board: Board, dir: Direction): Board | null {
  const empty = findEmpty(board);
  const tileIdx = neighborToSwap(empty, dir);
  if (tileIdx === null) return null;
  const next = board.slice();
  next[empty] = next[tileIdx]!;
  next[tileIdx] = 0;
  return next;
}

const ALL_DIRS: Direction[] = ['up', 'down', 'left', 'right'];

function opposite(dir: Direction): Direction {
  switch (dir) {
    case 'up':
      return 'down';
    case 'down':
      return 'up';
    case 'left':
      return 'right';
    case 'right':
      return 'left';
  }
}

/**
 * 從 solved 開始走 N 步隨機合法移動 → 必定可解。
 * 避免立刻反向;避免恰好留在 solved 狀態(殘酷起點才有挑戰)。
 */
export function shuffle(steps = CFG.shuffleSteps): Board {
  let board = createSolvedBoard();
  let lastDir: Direction | null = null;
  for (let i = 0; i < steps; i++) {
    const candidates = ALL_DIRS.filter((d) => {
      if (lastDir && d === opposite(lastDir)) return false;
      return tryMove(board, d) !== null;
    });
    if (candidates.length === 0) continue;
    const pickIdx = Math.floor(Math.random() * candidates.length);
    const dir = candidates[pickIdx]!;
    const next = tryMove(board, dir);
    if (!next) continue;
    board = next;
    lastDir = dir;
  }
  if (isSolved(board)) {
    // 極小概率剛好洗回 solved,推一步避免「按重玩變成已完成」
    const oneMore = tryMove(board, 'up') ?? tryMove(board, 'left');
    if (oneMore) board = oneMore;
  }
  return board;
}

/**
 * 給定 board,回傳每個非空 tile 的 id 與 row/col;
 * id 用磚塊上的數字(1..15)當穩定 React key。
 */
export function boardToTiles(board: Board): { id: number; row: number; col: number }[] {
  const tiles: { id: number; row: number; col: number }[] = [];
  for (let i = 0; i < board.length; i++) {
    const v = board[i];
    if (!v) continue;
    tiles.push({ id: v, row: Math.floor(i / N), col: i % N });
  }
  return tiles;
}
