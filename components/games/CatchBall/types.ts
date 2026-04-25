// 接球 — 共用型別與場景常數
//
// Canvas 內部解析度 800×480；外層 CSS aspect-ratio 縮放。

export const SLUG = 'catch-ball';

export const CFG = {
  width: 800,
  height: 480,

  // 籃子
  paddleY: 420,
  paddleW: 110,
  paddleH: 18,
  /** 鍵盤每秒移動速度 */
  paddleSpeedKey: 600,

  // 球
  ballR: 14,
  /** 初始下墜速度的中位數 */
  baseVy: 240,
  /** 速度的隨機振幅 */
  vyVariance: 60,
  /** 旋轉視覺速度 */
  spinSpeed: 4,

  // 難度（catches 控制：球速倍率與生成間隔）
  /** 1 + min(maxBoost, catches * boostPerCatch) */
  speedBoostPerCatch: 0.04,
  speedBoostMax: 2,
  /** 生成間隔範圍（ms） */
  spawnIntervalStart: 1500,
  spawnIntervalMin: 500,
  /** 多少 catches 後達到最快生成 */
  spawnRampCatches: 30,

  // 金球
  goldenChance: 0.08,
  goldenScore: 5,
  normalScore: 1,

  // 生命
  maxLives: 3,
} as const;

export const BALL_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f97316'] as const;
export const GOLDEN_COLOR = '#facc15';

export type Ball = {
  x: number;
  y: number;
  vy: number;
  r: number;
  color: string;
  isGolden: boolean;
  /** 旋轉相位（rad）；只是視覺,不影響碰撞 */
  spin: number;
};

/** 接球 / 漏球時上飄的提示文字 */
export type Popup = {
  x: number;
  y: number;
  text: string;
  color: string;
  age: number;
  ttl: number;
};

export type Result = 'gameOver' | null;
