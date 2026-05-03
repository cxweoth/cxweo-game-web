// 跳跳鳥 — 共用型別與場景常數
//
// Canvas 內部解析度 480×640,外層 CSS aspect-ratio 縮放。
// 物理單位 = px / s,所有運動 ref 內部用同一套單位。

export const SLUG = 'flappy-bird';

export const CFG = {
  width: 480,
  height: 640,

  groundH: 80,
  ceilingY: 0,

  // bird
  birdX: 120,
  birdR: 18,
  birdStartY: 280,
  gravity: 1500,
  jumpImpulse: -440,
  /** 最大下降速度,避免越掉越快視覺崩壞 */
  maxFallVy: 720,

  // pipes
  pipeW: 70,
  pipeGap: 150,
  /** 兩根水管的水平間距(中心到中心) */
  pipeSpacing: 220,
  /** 水管捲動速度;隨分數逐步加快 */
  pipeStartVx: -180,
  pipeMaxVx: -260,
  pipeAccelPer10: 8, // 每 10 分加 8 px/s
  /** 上下管子至少要露出多少高度給玩家穿 */
  pipeMinSidePad: 60,

  // 雲、地板捲動
  cloudVx: -30,
  groundVx: -180,
} as const;

export type PipePair = {
  /** x 為水管中心 */
  x: number;
  /** gap 中心 y */
  gapY: number;
  /** 是否已被計分(超過鳥的 x 一次) */
  passed: boolean;
};

export type Cloud = {
  x: number;
  y: number;
  scale: number;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  ttl: number;
  color: string;
};

/** 死亡瞬間的視覺 fx */
export type Fx = {
  shakeT: number; // 剩餘時間 (s)
  flashT: number;
};
