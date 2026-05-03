// 關燈 — 共用型別
//
// 5×5 燈板;每點一格,該格 + 上下左右 4 鄰會被「翻轉」(亮 → 暗 / 暗 → 亮)。
// 目標:所有燈全暗。最佳步數越少越強。

export const SLUG = 'lights-out';

export const SIZE = 5;
export const CELLS = SIZE * SIZE;

export type Difficulty = 'easy' | 'normal' | 'hard';

export const DIFFICULTY_CLICKS: Record<Difficulty, number> = {
  easy: 6,
  normal: 12,
  hard: 18,
};

export type Board = boolean[]; // length 25;true = 亮

export function indexOf(r: number, c: number): number {
  return r * SIZE + c;
}
