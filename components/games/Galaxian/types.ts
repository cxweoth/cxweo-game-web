// 小蜜蜂(Galaxian 風格)— 型別與場景常數
//
// 直式 480×640 Canvas:
//   - 上方:30 隻蜜蜂(5 列 × 6 行)整體左右擺動,碰邊下移一格
//   - 中段:俯衝中的蜜蜂用三角函數朝玩家直線飛
//   - 下方:玩家飛機(僅水平移動);子彈往上;蜜蜂炸彈往下
//
// 物理:dt-aware 60fps + rAF;所有速度單位 = px/s。

export const SLUG = 'galaxian';

export const CFG = {
  width: 480,
  height: 640,

  // 玩家飛機
  shipW: 38,
  shipH: 28,
  /** 玩家 y(底邊上方一點點固定軌道) */
  shipY: 580,
  shipSpeed: 320,
  /** 一次最多在場上的玩家子彈 */
  maxBullets: 4,
  /** 兩次射擊最短間隔 */
  shootCooldown: 0.18,
  bulletSpeed: 620,
  bulletW: 3,
  bulletH: 12,
  /** 玩家命數 */
  maxLives: 3,
  /** 受傷後的無敵時間(防止連續被打) */
  invulnDuration: 1.5,

  // 蜜蜂方陣
  beeRows: 5,
  beeCols: 6,
  beeW: 30,
  beeH: 24,
  /** 一格 cell 的水平 / 垂直間距 */
  beeCellW: 50,
  beeCellH: 38,
  /** 隊形左上角(formation 在這個座標起跳) */
  formationOriginX: 90,
  formationOriginY: 70,
  /** 站隊狀態的水平擺動速度(初始);剩越少越快 */
  swarmBaseSpeed: 40,
  /** 每剩 1 隻蜜蜂額外加速;n 隻時 speed = base + (totalBees - n) * accel */
  swarmAccelPerKill: 2.5,
  /** 整列碰到牆後往下沉 */
  swarmDropPerWall: 16,

  // 俯衝
  /** 兩波俯衝之間的最短間隔 */
  diveIntervalMin: 1.4,
  /** 兩波俯衝之間的最長間隔 */
  diveIntervalMax: 2.6,
  /** 一波最多同時派幾隻 */
  maveDiveBatch: 1,
  /** 俯衝速度;沿著「蜜蜂位置 → 玩家位置」單位向量乘以這個值 */
  diveSpeed: 220,
  /** 俯衝中的蜜蜂衝出底部後從上面歸隊;y 重置到此值 */
  diveRespawnY: -40,

  // 蜜蜂炸彈(俯衝中蜜蜂偶爾會丟)
  bombDropChancePerSec: 1.2,
  bombSpeed: 200,
  bombW: 4,
  bombH: 8,

  // 計分
  scoreStandingBee: 10,
  scoreDivingBee: 50,
  scoreClearWaveBonus: 500,
  /** 隊長(captain,紅蜜蜂)分數倍率 */
  captainScoreMultiplier: 2,

  // 每波難度成長 — 用 1 + (wave-1) * scale 線性放大,封頂避免後期太誇張
  /** 每波 swarm speed 加倍係數 */
  waveSpeedScalePerWave: 0.12,
  /** 每波 dive 間隔縮短係數 */
  waveIntervalScalePerWave: 0.1,
  /** 每波 dive 速度加成係數 */
  waveDiveSpeedScalePerWave: 0.06,
  /** 每波 bomb 投彈率加倍係數 */
  waveBombScalePerWave: 0.15,
  /** 整體難度倍率上限 */
  waveScaleCap: 2.5,
  /** batch size = 1 + floor((wave-1) / 隔幾波 +1) */
  waveDiveBatchPerN: 3,

  // 受傷後角色閃紅
  damageFlashDuration: 0.6,
  damageFlashHz: 14,
} as const;

export type GameStatus = 'playing' | 'gameOver' | 'won';

export type Ship = {
  /** 中心 x */
  x: number;
  /** 中心 y(固定 = CFG.shipY) */
  y: number;
  /** 受傷無敵剩餘秒數;> 0 = 無敵 + 閃爍 */
  invuln: number;
};

export type BeeState =
  /** 在隊形裡擺動 */
  | 'formation'
  /** 俯衝中(直線朝原本鎖定的目標位置) */
  | 'diving'
  /** 俯衝衝出底部、從上面飛回來歸隊 */
  | 'returning';

/** 一般蜜蜂 / 隊長蜜蜂 — 隊長用紅色,分數加倍 */
export type BeeType = 'regular' | 'captain';

export type Bee = {
  id: number;
  /** 在 5×6 矩陣裡的 row / col;歸隊時用來算回到哪個 cell */
  row: number;
  col: number;
  type: BeeType;
  /** 世界座標 — formation 狀態時 = swarm 原點 + cell offset */
  x: number;
  y: number;
  state: BeeState;
  /** 翅膀拍動相位(秒) */
  wingT: number;
  /** diving 時鎖定的單位向量 + 速度;朝這個方向直線飛 */
  vx: number;
  vy: number;
  /** returning 狀態下累計的時間;太久就強制歸位避免卡死 */
  returnT: number;
  /** alive=false 已被擊毀,從 world.bees 過濾掉 */
  alive: boolean;
};

export type Bullet = {
  x: number;
  y: number;
  alive: boolean;
};

export type Bomb = {
  x: number;
  y: number;
  alive: boolean;
};

export type SoundKind = 'shoot' | 'hit' | 'explode' | 'wave';
