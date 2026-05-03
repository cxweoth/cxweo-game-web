// 數獨 — 解題器
//
// 用 row/col/box 三組 9 位元 bitmask 加速:O(1) 判斷某數字在某格是否合法。
// 採 MRV(Minimum Remaining Values)選下一格,把難解的格先做;
// 比依序掃 0..80 快上一個量級,生成題時關鍵。
//
// solveCount(board, limit) 找到 ≥ limit 個解就提前停;
// 「目標 = 唯一解」時設 limit=2 即可:count===1 才合法。

import { CELLS, SIZE, boxOf, colOf, rowOf, type Board } from './types';

type Masks = {
  row: Int32Array; // 每列已使用數字的 bitmask
  col: Int32Array;
  box: Int32Array;
};

function buildMasks(board: Board): Masks | null {
  const row = new Int32Array(SIZE);
  const col = new Int32Array(SIZE);
  const box = new Int32Array(SIZE);
  for (let i = 0; i < CELLS; i++) {
    const v = board[i];
    if (!v) continue;
    const bit = 1 << (v - 1);
    const r = rowOf(i);
    const c = colOf(i);
    const b = boxOf(i);
    if (row[r]! & bit || col[c]! & bit || box[b]! & bit) return null;
    row[r]! |= bit;
    col[c]! |= bit;
    box[b]! |= bit;
  }
  return { row, col, box };
}

/** 回傳:目前候選最少的空格 idx;若沒有空格回 −1 */
function pickCellMRV(board: Board, m: Masks): { idx: number; cands: number } {
  let bestIdx = -1;
  let bestCount = 10;
  let bestCands = 0;
  for (let i = 0; i < CELLS; i++) {
    if (board[i] !== 0) continue;
    const used = m.row[rowOf(i)]! | m.col[colOf(i)]! | m.box[boxOf(i)]!;
    const cands = ~used & 0x1ff;
    let count = 0;
    let x = cands;
    while (x) {
      x &= x - 1;
      count++;
    }
    if (count < bestCount) {
      bestCount = count;
      bestIdx = i;
      bestCands = cands;
      if (count <= 1) break; // 已經是必填,直接展開
    }
  }
  return { idx: bestIdx, cands: bestCands };
}

/**
 * 計算解數;最多算到 limit。回傳 {count, first}。
 * count >= limit 表示「至少 limit 個解」,實際數可能更多但我們不在乎。
 */
export function solveCount(
  board: Board,
  limit = 2,
): { count: number; first: Board | null } {
  const initial = buildMasks(board);
  if (!initial) return { count: 0, first: null };
  // 內層 recurse 是閉包,TS 不會把 const 的 narrow 帶進去 → 重命名為非空變數
  const masks: Masks = initial;

  const work = board.slice();
  let count = 0;
  let first: Board | null = null;

  function recurse(): boolean {
    if (count >= limit) return true;
    const { idx, cands } = pickCellMRV(work, masks);
    if (idx === -1) {
      count++;
      if (count === 1) first = work.slice();
      return count >= limit;
    }
    if (cands === 0) return false; // 死局,回溯
    let x = cands;
    while (x) {
      const bit = x & -x;
      x ^= bit;
      const v = 31 - Math.clz32(bit) + 1;
      work[idx] = v;
      masks.row[rowOf(idx)]! |= bit;
      masks.col[colOf(idx)]! |= bit;
      masks.box[boxOf(idx)]! |= bit;
      if (recurse()) return true;
      work[idx] = 0;
      masks.row[rowOf(idx)]! ^= bit;
      masks.col[colOf(idx)]! ^= bit;
      masks.box[boxOf(idx)]! ^= bit;
    }
    return false;
  }

  recurse();
  return { count, first };
}

/** 簡單檢查:盤面在當前狀態下是否有解(用 limit=1) */
export function hasSolution(board: Board): boolean {
  return solveCount(board, 1).count >= 1;
}

/** 衝突檢查:列出與其他已填數字衝突的格 idx */
export function findConflicts(board: Board): Set<number> {
  const conflicts = new Set<number>();
  for (let g = 0; g < SIZE; g++) {
    // 列
    const seenRow: number[] = new Array(SIZE + 1).fill(-1);
    for (let c = 0; c < SIZE; c++) {
      const i = g * SIZE + c;
      const v = board[i];
      if (!v) continue;
      const prev = seenRow[v];
      if (prev !== undefined && prev !== -1) {
        conflicts.add(i);
        conflicts.add(prev);
      } else {
        seenRow[v] = i;
      }
    }
    // 欄
    const seenCol: number[] = new Array(SIZE + 1).fill(-1);
    for (let r = 0; r < SIZE; r++) {
      const i = r * SIZE + g;
      const v = board[i];
      if (!v) continue;
      const prev = seenCol[v];
      if (prev !== undefined && prev !== -1) {
        conflicts.add(i);
        conflicts.add(prev);
      } else {
        seenCol[v] = i;
      }
    }
    // 宮
    const br = Math.floor(g / 3) * 3;
    const bc = (g % 3) * 3;
    const seenBox: number[] = new Array(SIZE + 1).fill(-1);
    for (let dr = 0; dr < 3; dr++) {
      for (let dc = 0; dc < 3; dc++) {
        const i = (br + dr) * SIZE + (bc + dc);
        const v = board[i];
        if (!v) continue;
        const prev = seenBox[v];
        if (prev !== undefined && prev !== -1) {
          conflicts.add(i);
          conflicts.add(prev);
        } else {
          seenBox[v] = i;
        }
      }
    }
  }
  return conflicts;
}
