// 六貫棋 Hex — 共用型別
//
// Board 用 length-N² 一維陣列;0=空、1=黑、2=白。
// 座標採 axial(rhombus):row r ∈ [0, N),col c ∈ [0, N)。
// 黑(1)連通 row=0 與 row=N-1(垂直連通);白(2)連通 col=0 與 col=N-1(水平連通)。
// 注意:整盤呈平行四邊形,row 越大整體越往右下偏 — 視覺上左下與右上是「鈍角」。

export const SLUG = 'hex';

export const SIZES = [7, 9, 11] as const;
export type Size = (typeof SIZES)[number];

export type Cell = 0 | 1 | 2;
export type Player = 1 | 2;
export type Board = Cell[];

export type Mode = 'pvp' | 'ai';

export type Stats = {
  wins: number;
  losses: number;
  /** Hex 沒有平局,為對齊既有 readJSON 結構保留欄位但永遠為 0 */
  draws: number;
};

export const EMPTY_STATS: Stats = { wins: 0, losses: 0, draws: 0 };

export type Prefs = {
  mode: Mode;
  /** AI 模式下玩家執哪一色;預設黑(先手) */
  playerSide: Player;
  size: Size;
  /** Pie 規則(白方第二步可選擇 swap)以平衡先手優勢 */
  pieRule: boolean;
};

export const DEFAULT_PREFS: Prefs = {
  mode: 'ai',
  playerSide: 1,
  size: 11,
  pieRule: true,
};

export function rowCol(i: number, n: number): { row: number; col: number } {
  return { row: Math.floor(i / n), col: i % n };
}

export function indexOf(row: number, col: number, n: number): number {
  return row * n + col;
}

export function inBounds(row: number, col: number, n: number): boolean {
  return row >= 0 && row < n && col >= 0 && col < n;
}

export function opponent(p: Player): Player {
  return p === 1 ? 2 : 1;
}

/**
 * 六邊形鄰位(axial / rhombus offset):
 *   (r-1, c)   (r-1, c+1)
 *   (r,   c-1)            (r,   c+1)
 *   (r+1, c-1) (r+1, c)
 * 這個方向組合保證每格的 6 鄰位剛好相鄰、且不重複。
 */
export const HEX_DIRS: ReadonlyArray<readonly [number, number]> = [
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
] as const;
