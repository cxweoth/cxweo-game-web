// 迷宮吃豆(致敬 Pac-Man)— 共用型別與場景常數
//
// 19×21 經典迷宮,cell 24px;玩家位置以「像素中心」表示。
// tile-center 轉向機制:玩家在 tile 中心附近才能改方向(經典 Pac-Man 操作感)。

export const SLUG = 'maze-eater';

export const CFG = {
  cols: 19,
  rows: 21,
  cell: 24,
  /** Canvas 寬高(下方留 HUD 空間) */
  hudH: 56,
  /** 玩家速度(格/秒) */
  pacmanSpeed: 6.2,
  /** 鬼基本速度 */
  ghostSpeed: 5.4,
  /** 鬼 frightened 模式速度減半 */
  ghostFrightSpeed: 3.0,
  /** 鬼被吃後回家速度 */
  ghostEatenSpeed: 9,
  /** 大力丸效果時長(秒;Level 1 用) */
  frightDur: 7,
  /** 每關 frightDur 縮短秒數,封底 frightDurMin */
  frightDurDecay: 0.6,
  frightDurMin: 2.5,
  /** 每關鬼速倍數 ×(1 + (level-1) × ghostSpeedScale),封頂 ghostSpeedScaleMax */
  ghostSpeedScale: 0.05,
  ghostSpeedScaleMax: 1.5,
  /** frightened 即將結束時閃爍提示時長(秒) */
  frightFlashStart: 2,
  /** 起始命數 */
  initialLives: 3,
  /** 分數 */
  pelletScore: 10,
  powerScore: 50,
  /** 連吃鬼分數倍增 */
  ghostScores: [200, 400, 800, 1600],
  /** 水果觸發:吃完 ratio 比例豆子後,在鬼屋下方產生 1 顆水果 */
  fruitTriggerRatio: 0.3,
  /** 水果在場上的存活秒數 */
  fruitTtl: 10,
} as const;

export type FruitKind = 'cherry' | 'strawberry' | 'orange' | 'apple' | 'melon';

export type Fruit = {
  kind: FruitKind;
  /** tile 座標 */
  col: number;
  row: number;
  /** 剩餘存活秒數 */
  ttl: number;
  score: number;
};

/** 依 level 取本關水果(level 1-5+)。5 之後一律西瓜。 */
export function fruitForLevel(level: number): { kind: FruitKind; score: number } {
  if (level <= 1) return { kind: 'cherry', score: 300 };
  if (level === 2) return { kind: 'strawberry', score: 500 };
  if (level === 3) return { kind: 'orange', score: 700 };
  if (level === 4) return { kind: 'apple', score: 1000 };
  return { kind: 'melon', score: 1500 };
}

export const FRUIT_EMOJI: Record<FruitKind, string> = {
  cherry: '🍒',
  strawberry: '🍓',
  orange: '🍊',
  apple: '🍎',
  melon: '🍉',
};

export const CANVAS_W = CFG.cols * CFG.cell; // 456
export const CANVAS_H = CFG.rows * CFG.cell + CFG.hudH; // 560

export type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

export type CellKind = 'wall' | 'pellet' | 'power' | 'empty' | 'door';

export type Pacman = {
  /** 像素位置(中心) */
  x: number;
  y: number;
  dir: Direction;
  /** 玩家想要轉的方向(等到 tile center 才生效) */
  desiredDir: Direction;
  /** 嘴開合相位(0~1 累計) */
  mouthPhase: number;
  alive: boolean;
};

export type GhostKind = 'blinky' | 'pinky' | 'inky' | 'clyde';

export type GhostMode = 'home' | 'chase' | 'frightened' | 'eaten';

export type Ghost = {
  kind: GhostKind;
  x: number;
  y: number;
  dir: Direction;
  mode: GhostMode;
  /** 在家裡的累積秒數,> homeReleaseAt 才出去 */
  homeT: number;
  homeReleaseAt: number;
  /** frightened 結束的剩餘時間 */
  frightT: number;
};

export type Status = 'idle' | 'playing' | 'dying' | 'gameOver' | 'levelClear';

export type Stats = {
  highScore: number;
};

export const emptyStats: Stats = { highScore: 0 };

export const DIR_DX: Record<Direction, number> = {
  up: 0, down: 0, left: -1, right: 1, none: 0,
};
export const DIR_DY: Record<Direction, number> = {
  up: -1, down: 1, left: 0, right: 0, none: 0,
};

export function opposite(d: Direction): Direction {
  switch (d) {
    case 'up': return 'down';
    case 'down': return 'up';
    case 'left': return 'right';
    case 'right': return 'left';
    case 'none': return 'none';
  }
}
