// 射箭遊戲共用型別與場景常數
//
// Canvas 內部解析度固定 800×480；外層 CSS 用 aspect-ratio 縮放以支援 RWD。
// 所有座標、速度都以「Canvas 像素」為單位（y 朝下，與一般 web 一致）。

export const SLUG = 'archery';

export const CFG = {
  // Canvas 內部解析度
  width: 800,
  height: 480,
  ground: 400, // 地平線 y

  // 弓與標靶
  bowX: 90,
  bowY: 300,
  targetX: 600,
  targetY: 300,
  /** 標靶外環半徑（10 環 × ringW） */
  targetOuterR: 100,
  ringW: 10,

  // 物理
  gravity: 800, // px/s²
  /** 最低初速；單獨點擊不蓄力會射不到靶 */
  minPower: 450,
  maxPower: 950,
  /** 蓄滿到最大初速所需時間（ms） */
  chargeMs: 1000,

  // 瞄準
  defaultAngle: 25, // 度
  minAngle: -10,
  maxAngle: 70,
  /** 鍵盤每按一下調整的角度 */
  angleStepKey: 1.5,

  // 風（每箭隨機）
  windMin: 30, // px/s²；|wind| 最小
  windMax: 180,

  // 回合
  arrowsPerRound: 5,
} as const;

/** 內部子狀態；不同於 GameStatus，是 Canvas 元件自己管的 */
export type SubState = 'aiming' | 'charging' | 'flying';

/** 飛行中的箭 */
export type Arrow = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 視覺旋轉（rad），= atan2(vy, vx)，每幀更新 */
  angle: number;
  /** 拋物線軌跡（部分採樣用於繪製尾跡） */
  trail: Array<[number, number]>;
};

/** 已落下的箭（插在靶上或地上）；保留在畫面上做歷史回饋 */
export type LandedArrow = {
  x: number;
  y: number;
  /** 落下時的視覺旋轉 */
  angle: number;
  /** 0 為脫靶，1–10 為環分 */
  score: number;
};
