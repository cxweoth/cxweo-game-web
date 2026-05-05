// 六貫棋 Hex — 純規則邏輯
//
// 不依賴 React;測試友好的純函式。
// 勝負判定用 BFS 從「源邊」上的自己色格子出發、只走相同顏色的相鄰格,
// 看能不能觸及「目標邊」。N=11 只有 121 格,單次 BFS 微秒級,不需 Union-Find。

import {
  HEX_DIRS,
  inBounds,
  indexOf,
  rowCol,
  type Board,
  type Player,
} from './types';

export function createInitialBoard(n: number): Board {
  return new Array(n * n).fill(0) as Board;
}

/** 落子合法性:必須是空格 */
export function isPlayable(board: Board, idx: number): boolean {
  return board[idx] === 0;
}

/** 落子(immutable);呼叫端先用 isPlayable 確認 */
export function applyMove(board: Board, idx: number, player: Player): Board {
  const next = board.slice();
  next[idx] = player;
  return next;
}

/**
 * Pie 規則的 swap:把第一手的位置改成另一色,等同於白方「拿下黑方那一手」。
 * 實作上原黑子 → 白子,然後輪到黑下第二手。
 */
export function applySwap(board: Board, firstMoveIdx: number): Board {
  const next = board.slice();
  next[firstMoveIdx] = 2;
  return next;
}

/**
 * BFS 找贏家:player 從源邊出發,只走自己色的鄰位,能到目標邊就贏。
 * 黑(1):源 row=0,目標 row=n-1;白(2):源 col=0,目標 col=n-1。
 * 回傳贏的路徑(從源到目標的一條;沒贏則 null)。
 */
export function findWinningPath(
  board: Board,
  player: Player,
  n: number,
): number[] | null {
  const visited = new Uint8Array(n * n);
  const parent = new Int32Array(n * n).fill(-1);
  const queue: number[] = [];

  // 把源邊上屬於 player 的格子加入起點
  if (player === 1) {
    for (let c = 0; c < n; c++) {
      const i = indexOf(0, c, n);
      if (board[i] === 1) {
        visited[i] = 1;
        queue.push(i);
      }
    }
  } else {
    for (let r = 0; r < n; r++) {
      const i = indexOf(r, 0, n);
      if (board[i] === 2) {
        visited[i] = 1;
        queue.push(i);
      }
    }
  }

  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++]!;
    const { row, col } = rowCol(cur, n);
    const reachedTarget = player === 1 ? row === n - 1 : col === n - 1;
    if (reachedTarget) {
      // 回溯成 path
      const path: number[] = [];
      let x: number = cur;
      while (x !== -1) {
        path.push(x);
        x = parent[x]!;
      }
      return path.reverse();
    }
    for (const [dr, dc] of HEX_DIRS) {
      const nr = row + dr;
      const nc = col + dc;
      if (!inBounds(nr, nc, n)) continue;
      const ni = indexOf(nr, nc, n);
      if (visited[ni]) continue;
      if (board[ni] !== player) continue;
      visited[ni] = 1;
      parent[ni] = cur;
      queue.push(ni);
    }
  }

  return null;
}

/** 簡化 API:有沒有贏家(不關心路徑) */
export function isWinFor(board: Board, player: Player, n: number): boolean {
  return findWinningPath(board, player, n) !== null;
}

/** 結算:回傳贏家或 0(尚未分勝負;Hex 沒有平局) */
export function checkWinner(board: Board, n: number): 0 | 1 | 2 {
  if (isWinFor(board, 1, n)) return 1;
  if (isWinFor(board, 2, n)) return 2;
  return 0;
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
