// 黑白棋 — 共用型別
//
// Board 用 length-64 的陣列;0=空、1=黑、2=白(以一維陣列方便傳遞與 immutable 複製)。

export const SLUG = 'reversi';

export const SIZE = 8;
export const CELLS = SIZE * SIZE;

export type Cell = 0 | 1 | 2;
export type Player = 1 | 2;
export type Board = Cell[];

export type Mode = 'pvp' | 'ai';

/** 每個合法步驟同時記下會翻的棋子,放置時就不必重算 */
export type Move = {
  index: number;
  flips: number[];
};

export type Stats = {
  wins: number;
  losses: number;
  draws: number;
};

export const EMPTY_STATS: Stats = { wins: 0, losses: 0, draws: 0 };

export type Prefs = {
  mode: Mode;
  /** AI 模式下玩家執哪一色;預設黑(先手) */
  playerSide: Player;
};

export const DEFAULT_PREFS: Prefs = {
  mode: 'ai',
  playerSide: 1,
};

export function rowCol(i: number): { row: number; col: number } {
  return { row: Math.floor(i / SIZE), col: i % SIZE };
}

export function indexOf(row: number, col: number): number {
  return row * SIZE + col;
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

export function opponent(p: Player): Player {
  return p === 1 ? 2 : 1;
}
