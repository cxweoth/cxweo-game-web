// 下樓梯 — 型別與場景常數
//
// Canvas 內部解析度 480×720（直式）。

export const SLUG = 'stairs';

export const CFG = {
  width: 480,
  height: 720,

  /** 天花板 y；角色頭頂超過視為被壓死 */
  ceilingY: 60,

  // 角色
  charW: 28,
  charH: 36,
  charXInit: 240,
  charYInit: 200,
  /** 鍵盤每秒水平速度 */
  charSpeedKey: 380,

  // 物理
  gravity: 1300,
  /** 防穿透的下墜上限 */
  maxVy: 720,
  /** 樓梯每秒往上捲動 */
  scrollSpeedStart: 110,
  /** 隨深度漸增到此 */
  scrollSpeedMax: 240,
  /** 每深度 scoreDepthRamp 加速一次 */
  scrollDepthRamp: 30,

  // 樓梯
  stairW: 110,
  stairH: 12,
  stairSpacingMin: 78,
  stairSpacingMax: 130,
  /** 出生機率（剩下為 normal） */
  spikeChance: 0.13,
  fragileChance: 0.08,

  // HP
  maxHP: 3,
  /** 受擊後的無敵時間 */
  invulnMs: 800,
} as const;

export type StairType = 'normal' | 'spike' | 'fragile';

export type Stair = {
  /** 唯一 id（避免重複計分） */
  id: number;
  /** 左緣 x */
  x: number;
  /** 上緣 y */
  y: number;
  w: number;
  type: StairType;
  /** fragile 踩過後標 true */
  broken: boolean;
};

export type Character = {
  /** 中心 x */
  x: number;
  /** 上緣 y */
  y: number;
  vy: number;
  facing: -1 | 1;
  /** 無敵到 performance.now() ms 為止 */
  invulnUntil: number;
};
