// 打磚塊 — 共用型別與場景常數
//
// Canvas 內部解析度 640×480(橫式),CSS aspect-ratio 縮放。

export const SLUG = 'breakout';

export const CFG = {
  width: 640,
  height: 480,

  // 板子(底部水平)
  paddleY: 440,
  /** 初始寬;每升一級 −6,封底 50 */
  paddleW0: 86,
  paddleWMin: 50,
  paddleH: 12,
  paddleSpeedKey: 600,

  // 球
  ballR: 7,
  /** 第 1 關發球速度;每關 +10% */
  ballSpeed0: 320,
  /** 速度上限,避免後期穿透 */
  ballSpeedMax: 620,
  /** 每打掉一塊磚速度 +0.5%(線性) */
  speedPerBrick: 0.005,
  speedPerLevel: 0.10,
  /** 進入 sticky 狀態後 800ms 自動發球 */
  autoLaunchMs: 800,

  // 磚塊
  brickRows: 5,
  brickCols: 10,
  brickGap: 4,
  brickTop: 70,
  brickH: 20,
  brickSideMargin: 12,
  /** 每排顏色與分數;index = row(由上到下) */
  brickRowColors: [
    '#a78bfa', // purple-400
    '#60a5fa', // blue-400
    '#34d399', // emerald-400
    '#fbbf24', // amber-400
    '#fb7185', // rose-400
  ],
  brickRowScores: [50, 40, 30, 20, 10],

  startLives: 3,
} as const;

export type Brick = {
  x: number;
  y: number;
  w: number;
  h: number;
  alive: boolean;
  color: string;
  points: number;
};

export type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  color: string;
  size: number;
};

export type TickResult = {
  /** 本幀打掉的磚塊總分(同 step 多塊會累加) */
  brickScore: number;
  lifeLost: boolean;
};
