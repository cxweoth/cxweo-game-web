// 數獨 — 共用型別與常數
//
// Board 用長度 81 的陣列;index = row*9 + col。0 表示空格。
// Notes 用 9 位元 bitmask:bit i (1<<i) 表示候選數字 (i+1)。

export const SLUG = 'sudoku';

export const SIZE = 9;
export const CELLS = SIZE * SIZE;

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export const DIFF_LABEL: Record<Difficulty, string> = {
  easy: '初級',
  medium: '中級',
  hard: '高級',
  expert: '困難',
};

/** 各難度保留的 clue(線索)目標數;低於 22 幾乎不可能保證唯一解,所以困難封底 24。 */
export const DIFF_CLUES: Record<Difficulty, number> = {
  easy: 40,
  medium: 32,
  hard: 27,
  expert: 24,
};

export type Cell = number; // 0..9
export type Board = Cell[]; // length 81

/** 每格筆記:bitmask,bit 0 = 候選 1、bit 8 = 候選 9 */
export type NotesArr = number[]; // length 81

export function rowOf(idx: number): number {
  return Math.floor(idx / SIZE);
}
export function colOf(idx: number): number {
  return idx % SIZE;
}
export function boxOf(idx: number): number {
  return Math.floor(rowOf(idx) / 3) * 3 + Math.floor(colOf(idx) / 3);
}
