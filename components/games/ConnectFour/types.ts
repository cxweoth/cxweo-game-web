// 連線四子 — 共用型別
//
// Board 用長度 42 的陣列;index = row * COLS + col。
// row 0 為「最頂排」,row 5 為「最底排」(視覺上的下方,棋子掉落停在這)。

export const SLUG = 'connect-four';

export const COLS = 7;
export const ROWS = 6;
export const CELLS = COLS * ROWS;
export const WIN = 4;

export type Cell = 0 | 1 | 2;
export type Player = 1 | 2;
export type Board = Cell[];

export type Mode = 'pvp' | 'ai';

export type Prefs = {
  mode: Mode;
  /** AI 模式時玩家的色;預設紅色(先手) */
  playerSide: Player;
  /** AI 思考深度;預設 5。降低可加速、提高更難。 */
  aiDepth: number;
};

export const DEFAULT_PREFS: Prefs = {
  mode: 'ai',
  playerSide: 1,
  aiDepth: 5,
};

export type Stats = {
  wins: number;
  losses: number;
  draws: number;
};

export const EMPTY_STATS: Stats = { wins: 0, losses: 0, draws: 0 };

export function indexOf(row: number, col: number): number {
  return row * COLS + col;
}

export function rowCol(idx: number): { row: number; col: number } {
  return { row: Math.floor(idx / COLS), col: idx % COLS };
}

export function opponent(p: Player): Player {
  return p === 1 ? 2 : 1;
}
