// 跳躍王 — 共用型別
//
// Canvas 直式 360×640。座標:y 越往上越「小」(像 SVG/Canvas 標準)。
// 但本遊戲世界座標的 y 隨上升「變更小」,世界只會向上長;
// camY 永遠 ≤ 初始值,score = (initial − camY) >> 1。

export const SLUG = 'doodle-jump';

export const CFG = {
  width: 360,
  height: 640,

  playerW: 36,
  playerH: 36,
  /** 重力 px/s² */
  gravity: 1400,
  /** 一般平台跳的初速 */
  jumpVy: -680,
  /** 彈簧平台跳的初速 */
  springVy: -1100,
  /** 玩家左右移動最大水平速度 */
  moveVx: 360,
  /** 平台尺寸 */
  platW: 64,
  platH: 12,
  /** 攝影機跟隨閥值:玩家高過 height*upperRatio 時鏡頭上推 */
  upperRatio: 0.4,

  /** 平台垂直密度:每隔多少像素一根(會帶 ±隨機) */
  platVStep: 78,
  /** 第一塊平台的世界 y(玩家初始位置下方一點點,做為起步) */
  startPlatY: 580,
} as const;

export type PlatformKind = 'normal' | 'moving' | 'breakable' | 'spring';

export type Platform = {
  /** 世界座標 */
  x: number;
  y: number;
  w: number;
  kind: PlatformKind;
  /** moving 用:水平速度 */
  vx?: number;
  /** breakable 是否已碎 */
  broken?: boolean;
  /** spring 動畫:0..1 表示 squash 到 release 進度 */
  spring?: number;
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
