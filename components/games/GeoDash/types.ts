// 節奏方塊(致敬 Geometry Dash Stereo Madness)— 共用型別與場景常數
//
// 世界座標:玩家固定在 x=playerX,世界往左滾動。Obstacle 用「世界 x」
// 表示,每幀減去 cameraX 即螢幕位置。

export const SLUG = 'geo-dash';

export const CFG = {
  width: 800,
  height: 460,
  /** 地面 y(玩家腳底站位) */
  ground: 380,
  /** 玩家固定螢幕 x */
  playerX: 200,
  /** 玩家立方體邊長(碰撞箱) */
  playerSize: 30,
  /** 世界滾動速度(像素/秒) */
  scrollSpeed: 360,
  /** 跳躍初速(往上為負) */
  jumpV: 760,
  /** 重力(每秒加 vy 多少,正向往下) */
  gravity: 2200,
  /** 一格的世界寬(對應節拍 ≈ 0.41s × 360px/s ≈ 148px,但取較小整數方便編關) */
  tile: 30,
  /** BPM(配樂用) */
  bpm: 145,
} as const;

export type Mode = 'level' | 'endless';

export type Status = 'idle' | 'playing' | 'dead' | 'won';

/** 障礙物類型(都是 AABB 碰撞,差別在外觀與致死規則) */
export type Obstacle =
  | { kind: 'spike'; x: number }
  | { kind: 'block'; x: number; w: number; h: number }
  | { kind: 'pad'; x: number };

export type PlayerState = {
  /** 螢幕 x(固定);實作上玩家不動,世界動 */
  x: number;
  /** y 為「離地高度」(0=站地、負=空中) */
  y: number;
  vy: number;
  grounded: boolean;
  /** 跳躍動畫累積角度(rad);grounded 時對齊整數倍 90° */
  rotation: number;
  /** 死亡瞬間紀錄,給特效用 */
  deadAt: { x: number; y: number; ms: number } | null;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  ttl: number;
  color: string;
  r: number;
};

export type Stats = {
  /** 手工關最佳完成時間(秒);未完成為 null */
  bestLevelMs: number | null;
  /** 無盡模式最遠距離(像素) */
  bestEndless: number;
  /** 手工關通關次數 */
  levelClears: number;
};

export const emptyStats: Stats = {
  bestLevelMs: null,
  bestEndless: 0,
  levelClears: 0,
};
