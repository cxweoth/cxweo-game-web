// 泡泡龍 — 型別與場景常數
//
// 直式 480×720 Canvas。蜂巢格佈局：奇數列向右偏移半格。

export const SLUG = 'bubble-shooter';

export const CFG = {
  width: 480,
  height: 720,

  // 泡泡與格子（蜂巢）
  bubbleR: 16,
  cellW: 32,
  /** 蜂巢列垂直間距：32 * sin(60°) ≈ 27.7，取整數 28 */
  cellH: 28,
  cols: 12,
  /** 第幾列以下被泡泡接觸 → 遊戲結束 */
  loseRow: 17,
  /** 起始填多少列 */
  initRows: 6,

  // 射擊
  /** 子彈速度（px/s） */
  shotSpeed: 780,
  /** 射手位置（中心 x、y） */
  shooterX: 240,
  shooterY: 660,
  /** 瞄準角度上限（度，從正上方算左右） */
  aimLimitDeg: 80,
  /** 鍵盤每按一下的角度增量 */
  aimStepKey: 1.5,

  // 遊戲節奏
  /** 連續多少次射擊未消除 → 整盤往下移一列 */
  pushDownAfterShots: 7,
} as const;

export type Color = 'red' | 'blue' | 'green' | 'yellow' | 'purple';

export const COLORS: ReadonlyArray<Color> = ['red', 'blue', 'green', 'yellow', 'purple'];

export const COLOR_HEX: Record<Color, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#facc15',
  purple: '#a855f7',
};

export type Cell = { color: Color } | null;
export type Grid = Cell[][];

export type Flying = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: Color;
};

/** 爆掉的泡泡，做飛散+淡出動畫 */
export type PopFx = {
  x: number;
  y: number;
  color: Color;
  age: number;
  ttl: number;
};
