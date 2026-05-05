// 劍盾決鬥 — 共用型別與場景常數
//
// Canvas 內部解析度 800×460;外層 CSS aspect-ratio 縮放支援 RWD。
// 玩家(藍衣騎士)在左、怪物(綠色哥布林)在右,2D 平台對戰。

export const SLUG = 'sword-duel';

export const CFG = {
  width: 800,
  height: 460,
  ground: 380,

  // --- 玩家 ---
  playerStartX: 220,
  playerHP: 100,
  /** 騎士身體寬高(碰撞箱) */
  playerW: 28,
  playerH: 60,
  playerSpeed: 240,
  /** 揮劍動作總長(秒) */
  playerSwingDur: 0.26,
  /** 揮劍 hitbox 啟動的時間段 */
  playerHitFrom: 0.05,
  playerHitTo: 0.16,
  /** 揮劍冷卻(整個 swing 結束後再算) */
  playerSwingCooldown: 0.08,
  /** 劍命中怪物的傷害 */
  playerDamage: 14,
  /** 玩家劍範圍(往面對方向延伸) */
  playerReach: 70,
  /** 攻擊判定垂直高度(以玩家身體中心為基準) */
  playerAttackBoxH: 78,
  /** 受擊後無敵時間 */
  playerInvulMs: 420,
  /** 跳躍初速(往上為負);搭配重力會跳起後落回 */
  playerJumpV: 740,
  /** 重力(每秒加 vy 多少,正向往下) */
  playerGravity: 1450,

  // --- 怪物(調整後對玩家較公平) ---
  bossStartX: 580,
  bossHP: 130,
  bossW: 56,
  bossH: 84,
  bossSpeed: 88,
  /** 揮劍動作總長(較慢,給玩家反應) */
  bossSwingDur: 0.6,
  bossHitFrom: 0.2,
  bossHitTo: 0.34,
  /** 兩次行動間隔(approach 時用 0,guard/swing 結束後用) */
  bossActionGapMs: 280,
  /** 怪物揮劍傷害 */
  bossDamage: 11,
  /** 怪物揮劍範圍 */
  bossReach: 72,
  bossAttackBoxH: 78,
  /** 進入攻擊範圍的距離(中心 vs 中心) */
  bossEngageDist: 96,
  /** Guard 持續時間範圍(隨機) */
  bossGuardMinMs: 600,
  bossGuardMaxMs: 1100,
  /** Hurt 硬直時間 */
  bossHurtMs: 280,
  /** 受擊後無敵時間 */
  bossInvulMs: 220,

  // --- 共用 ---
  /** 受傷紅閃時長 */
  flashMs: 160,
} as const;

export type Status = 'playing' | 'gameOver';
export type Result = 'win' | 'lose' | null;

/** 玩家狀態:1=面對右(看著怪物)、-1=面對左 */
export type Facing = 1 | -1;

export type PlayerState = {
  x: number;
  /** 垂直 offset:0 = 站在地上,負值代表往上(離地高度) */
  y: number;
  /** 垂直速度;正向往下 */
  vy: number;
  /** 是否站在地上(可起跳) */
  grounded: boolean;
  /** 1=向右、-1=向左,根據移動鍵或最後動作更新 */
  facing: Facing;
  /** 揮劍剩餘時間(秒);0 = idle */
  swingT: number;
  /** 揮劍動作完成後 cooldown 倒數 */
  cooldownT: number;
  /** 受傷無敵到期時間(performance.now ms) */
  invulUntil: number;
  flashUntil: number;
  /** 本次 swing 是否已對怪物造成傷害(避免一次揮劍 multi-hit) */
  hitThisSwing: boolean;
};

/** 怪物 AI 狀態 */
export type BossPhase = 'approach' | 'guard' | 'swing' | 'hurt' | 'dead';

export type BossState = {
  x: number;
  facing: Facing;
  phase: BossPhase;
  /** 目前 phase 的累積時間(秒) */
  phaseT: number;
  /** phase 預定持續時間(秒);swing/guard/hurt 用;approach 為 0 */
  phaseDur: number;
  /** action gap 倒數(秒);新 phase 結束後切下一個前的小停頓 */
  gapT: number;
  flashUntil: number;
  invulUntil: number;
  hitThisSwing: boolean;
};

/** 飛起的傷害數字 */
export type FloatText = {
  x: number;
  y: number;
  vy: number;
  age: number;
  ttl: number;
  text: string;
  color: string;
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

export type Shake = {
  startMs: number;
  durationMs: number;
  intensity: number;
};

export type Stats = {
  wins: number;
  losses: number;
};

export const emptyStats: Stats = { wins: 0, losses: 0 };
