// 蜂巢座標換算、相鄰、連通搜尋、漂浮判定。
// 所有函式皆純（無副作用）。

import { CFG, COLORS, type Color, type Grid } from './types';

/** 格 (row, col) → 像素中心 (x, y) */
export function gridToPixel(row: number, col: number): { x: number; y: number } {
  const xOff = row % 2 === 1 ? CFG.cellW / 2 : 0;
  return {
    x: col * CFG.cellW + CFG.cellW / 2 + xOff,
    y: row * CFG.cellH + CFG.bubbleR + 4,
  };
}

/** 像素 (x, y) → 最近的格 (row, col)（可能越界） */
export function pixelToGrid(x: number, y: number): { row: number; col: number } {
  const row = Math.round((y - CFG.bubbleR - 4) / CFG.cellH);
  const xOff = row % 2 === 1 ? CFG.cellW / 2 : 0;
  const col = Math.round((x - CFG.cellW / 2 - xOff) / CFG.cellW);
  return { row, col };
}

/** 蜂巢 6 鄰；奇偶列偏移不同 */
export function neighbors(row: number, col: number): Array<[number, number]> {
  const odd = row % 2 === 1;
  const offsets: ReadonlyArray<readonly [number, number]> = odd
    ? [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]]
    : [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]];
  return offsets.map(([dr, dc]) => [row + dr, col + dc]);
}

/** 從 (row, col) 找出所有相連同色泡泡（含起點） */
export function findConnectedSameColor(
  grid: Grid,
  row: number,
  col: number,
  color: Color,
): Array<[number, number]> {
  const visited = new Set<string>();
  const queue: Array<[number, number]> = [[row, col]];
  const result: Array<[number, number]> = [];
  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (c < 0 || c >= CFG.cols || r < 0) continue;
    const cell = grid[r]?.[c];
    if (!cell || cell.color !== color) continue;
    result.push([r, c]);
    for (const [nr, nc] of neighbors(r, c)) queue.push([nr, nc]);
  }
  return result;
}

/** 找出沒接到頂部的「漂浮」泡泡，需要掉落 */
export function findFloating(grid: Grid): Array<[number, number]> {
  const visited = new Set<string>();
  const queue: Array<[number, number]> = [];
  for (let c = 0; c < CFG.cols; c++) {
    if (grid[0]?.[c]) queue.push([0, c]);
  }
  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    if (c < 0 || c >= CFG.cols || r < 0 || r >= grid.length) continue;
    if (!grid[r]?.[c]) continue;
    visited.add(key);
    for (const [nr, nc] of neighbors(r, c)) queue.push([nr, nc]);
  }
  const floating: Array<[number, number]> = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < CFG.cols; c++) {
      if (grid[r]?.[c] && !visited.has(`${r},${c}`)) floating.push([r, c]);
    }
  }
  return floating;
}

/** 在 (x, y) 找一個空格附著（要與既有泡泡相鄰；若整盤空就放最頂列） */
export function findAttachCell(
  grid: Grid,
  x: number,
  y: number,
): { row: number; col: number } | null {
  // 若整盤無泡泡：放在最近頂列
  let hasAny = false;
  for (const row of grid)
    for (const c of row)
      if (c) {
        hasAny = true;
        break;
      }
  if (!hasAny) {
    const g = pixelToGrid(x, y);
    return {
      row: Math.max(0, g.row),
      col: Math.max(0, Math.min(CFG.cols - 1, g.col)),
    };
  }
  // 找與飛行泡泡距離最近的填滿格
  let bestFilled: { row: number; col: number; d: number } | null = null;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < CFG.cols; c++) {
      if (!grid[r]?.[c]) continue;
      const p = gridToPixel(r, c);
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (!bestFilled || d < bestFilled.d) bestFilled = { row: r, col: c, d };
    }
  }
  if (!bestFilled) return null;
  // 找最填滿格的最近空鄰居
  let best: { row: number; col: number; d: number } | null = null;
  for (const [nr, nc] of neighbors(bestFilled.row, bestFilled.col)) {
    if (nc < 0 || nc >= CFG.cols || nr < 0) continue;
    if (grid[nr]?.[nc]) continue;
    const p = gridToPixel(nr, nc);
    const d = (p.x - x) ** 2 + (p.y - y) ** 2;
    if (!best || d < best.d) best = { row: nr, col: nc, d };
  }
  return best;
}

/** 隨機色：只從畫面上仍存在的顏色挑（避免發出絕對打不到的色） */
export function randomColor(grid: Grid): Color {
  const set = new Set<Color>();
  for (const row of grid) {
    for (const c of row) {
      if (c) set.add(c.color);
    }
  }
  const pool = set.size > 0 ? Array.from(set) : COLORS;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

/** 確保 grid 有至少 rows 列;不足就在底部補空列 */
export function ensureRows(grid: Grid, rows: number): void {
  while (grid.length < rows) {
    grid.push(Array.from({ length: CFG.cols }, () => null as Cell));
  }
}

// 為了避免多次 import 一個型別，這裡 re-export
type Cell = { color: Color } | null;
