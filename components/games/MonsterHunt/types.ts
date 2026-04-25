// 弓手獵怪 — 共用型別與場景常數
//
// Canvas 內部解析度 800×480；外層 CSS aspect-ratio 縮放支援 RWD。

export const SLUG = 'monster-hunt';

export const CFG = {
  width: 800,
  height: 480,
  ground: 420,

  // 玩家（弓手）
  playerX: 90,
  playerYInit: 240,
  playerYMin: 80,
  playerYMax: 380,
  /** 命中半徑（火球 vs 玩家） */
  playerR: 18,
  /** 鍵盤每秒移動速度 */
  playerSpeedKey: 360,

  // 怪物
  monsterX: 680,
  monsterYInit: 240,
  monsterYMin: 90,
  monsterYMax: 380,
  /** 命中半徑（箭 vs 怪物） */
  monsterR: 30,
  /** 怪物移動速度（往目標 Y 直線靠近） */
  monsterSpeed: 150,
  /** 多久換一次目標 Y（ms） */
  monsterRetargetMs: 1500,
  /** 多久發射一次火球（ms） */
  monsterShootMs: 1450,

  // HP
  playerHP: 10,
  monsterHP: 5,

  // 投射物
  /** 玩家箭速度（px/s） */
  arrowSpeed: 620,
  /** 兩箭最短間隔（ms） */
  arrowCooldownMs: 320,
  /** 怪物火球速度（px/s）— 比箭慢，留閃避空間 */
  fireballSpeed: 360,
  /** 火球視覺半徑 */
  fireballR: 8,
  /** 火球命中半徑（略大於視覺，玩家手感） */
  fireballHitR: 9,
} as const;

export type Arrow = {
  x: number;
  y: number;
  vx: number;
  /** 命中後標 true，下一輪 sweep 移除 */
  dead: boolean;
};

export type Fireball = {
  x: number;
  y: number;
  vx: number;
  /** 視覺脈動相位（每幀加 dt） */
  phase: number;
  dead: boolean;
};

/** 噴出的粒子（死亡特效用） */
export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 已存活時間（秒） */
  age: number;
  /** 壽命上限（秒） */
  ttl: number;
  color: string;
  r: number;
};

/** 死亡特效狀態 */
export type DeathFx = {
  /** 起始時間（performance.now ms） */
  startMs: number;
  /** 死亡發生位置（畫布座標） */
  x: number;
  y: number;
  /** 影響顏色與文字 */
  side: 'monster' | 'player';
};

/** 螢幕震動 */
export type Shake = {
  startMs: number;
  durationMs: number;
  /** 最大像素偏移 */
  intensity: number;
};

export type Result = 'win' | 'lose' | null;

export type Stats = {
  wins: number;
  losses: number;
};

export const emptyStats: Stats = { wins: 0, losses: 0 };
