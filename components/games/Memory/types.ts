// 記憶翻牌 — 共用型別與場景常數

import type { GameStatus } from '@/types/game';

export const SLUG = 'memory';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type DifficultyConfig = {
  label: string;
  rows: number;
  cols: number;
};

/** 三難度:總卡數必為偶數 */
export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: { label: '初級', rows: 3, cols: 4 },     // 12 張 = 6 對
  medium: { label: '中級', rows: 4, cols: 4 },   // 16 張 = 8 對
  hard: { label: '高級', rows: 4, cols: 6 },     // 24 張 = 12 對
};

/**
 * 卡面圖示池(用 emoji 當圖,不需要圖檔)。
 * 高級需要 12 種,池中至少 12 個。
 */
export const SYMBOL_POOL = [
  '🍎', '🍌', '🍇', '🍓', '🍑', '🍒',
  '🍋', '🥝', '🍉', '🥥', '🍐', '🥑',
] as const;

export type CardState = 'down' | 'up' | 'matched';

export type Card = {
  /** 唯一 ID(React key + 翻牌動作識別);洗牌後重新分配 */
  id: number;
  symbol: string;
  state: CardState;
};

export type MemoryState = {
  difficulty: Difficulty;
  status: GameStatus;
  cards: Card[];
  /** 目前翻起來但還沒判定的卡片 id;長度為 0、1 或 2 */
  flippedIds: number[];
  /** 累計嘗試次數(每翻起兩張算一次,不論是否配對) */
  attempts: number;
  matched: number;     // 已配對對數
  startedAt: number | null;  // 第一次翻牌的 ms 時間戳
  endedAt: number | null;
};

export function totalPairs(d: Difficulty): number {
  const c = DIFFICULTIES[d];
  return (c.rows * c.cols) / 2;
}

/** 給每個難度獨立的最佳時間 key,沿用既有 getBestTime/setBestTime API */
export function bestTimeKey(d: Difficulty): string {
  return `memory:${d}`;
}
