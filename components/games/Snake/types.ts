// 貪食蛇 — 共用型別與場景常數
//
// Canvas 內部解析度 480×480(20×20 grid * 24px),外層 CSS aspect-ratio 縮放。

export const SLUG = 'snake';

export const CFG = {
  gridW: 20,
  gridH: 20,
  cellPx: 24,
  width: 480,
  height: 480,

  // 初始蛇:長度 4,頭在中央偏左,朝右
  initialLength: 4,
  initialHeadX: 8,
  initialHeadY: 10,
  initialDx: 1,
  initialDy: 0,

  // 步進速度:每吃一顆 −5ms,封底 75ms。180→75 等於約 21 顆食物達峰。
  stepStartMs: 180,
  stepMinMs: 75,
  stepDecPerFood: 5,

  foodScore: 10,
} as const;

export type Vec = { x: number; y: number };
export type Dir = { dx: number; dy: number };

/** 吃到食物時飄字 */
export type Popup = {
  x: number;
  y: number;
  text: string;
  color: string;
  age: number;
  ttl: number;
};
