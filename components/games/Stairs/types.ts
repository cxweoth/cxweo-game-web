// 下樓梯 (NS-SHAFT 風格) — 型別與場景常數
//
// 完全照原版 NS-SHAFT (https://github.com/YYYYMao/NS-SHAFT) 的邏輯重寫。
// Canvas 直式 480×740,不過原版用 setInterval(40ms) 整數步進,
// 我們改成 dt-aware 60fps + rAF;所有「per-frame 整數」常數已換算成 px/s。

export const SLUG = 'stairs';

/** 6 種階梯類型(對齊原版 NS-SHAFT 經典版) */
export type StairType = 'normal' | 'spike' | 'spring' | 'conveyor' | 'crumbling' | 'flip';

/** 滾輪方向(僅 conveyor 用) */
export type ConveyorDir = 'left' | 'right';

export const CFG = {
  width: 480,
  height: 740,

  // 天花板殺傷區
  /** 角色頂端 y < 此值就算撞到刺天花板,扣 HP */
  ceilingY: 35,
  /** 天花板貼圖高度 */
  ceilingImageH: 40,

  // 角色 (NS-SHAFT: man.width=man.height=40, init x=200, y=300)
  charW: 40,
  charH: 40,
  /** 中心 X(原版 man.x=200 = 中心 220) */
  charXInit: 220,
  charYInit: 300,
  /** 鍵盤水平速度;原版 ms = 250 px/s */
  charSpeedKey: 250,
  /** 滾輪每秒推力 */
  conveyorSpeed: 110,

  // 物理
  /** 不在 stair 上時的「終端」下墜速度;原版 +10/frame @ 25fps = 250 px/s */
  fallSpeed: 250,
  /** 彈簧初速(往上,vy 取負值);搭配 gravity 形成連續拋物線 */
  bounceVy: 700,
  /** 彈簧落地當幀立刻把角色再往上推的距離,確保下一幀進 air 分支 */
  bounceLift: 50,
  /** 重力加速度(px/s²);拉低 vy 形成上升減速 → 下墜加速 */
  gravity: 2500,

  // 彈跳動畫:用 squash & stretch 多幀變形,模擬「角色被彈簧壓扁→拉長噴上去」的卡通感
  /** 整段彈跳動畫的最長秒數;超過這時間沒落地就自動回到一般 idle */
  bounceAnimDuration: 0.55,
  /** 第一格「壓扁」幀持續時間 */
  bounceSquashDuration: 0.07,
  /** 壓扁時 X 方向放大比例(>1 變寬) */
  bounceSquashSx: 1.35,
  /** 壓扁時 Y 方向縮放比例(<1 變矮) */
  bounceSquashSy: 0.65,
  /** 拉長峰值 X 方向縮放比例(<1 變瘦) */
  bounceStretchSx: 0.78,
  /** 拉長峰值 Y 方向放大比例(>1 變高) */
  bounceStretchSy: 1.4,

  // 階梯 (block.width=150, height=30)
  stairW: 150,
  stairH: 30,
  /** 永遠在場上的階梯數 */
  stairCount: 10,

  // 尖刺階:基座(視為一般階)+ 尖刺(畫在角色之上,踩到時刺穿身體)
  /** 一根尖刺從基座頂端往上的高度;這部分會疊在角色身上 */
  spikeTipHeight: 22,
  /** 一個 spike stair 上有幾根刺 */
  spikeCount: 8,

  // 受傷閃紅
  /** 受傷後角色閃紅色的整段持續時間 */
  damageFlashDuration: 0.5,
  /** 閃爍頻率(每秒切換次數);較高 = 抖得更快 */
  damageFlashHz: 12,
  /** 紅色覆蓋的最大 alpha;會隨時間衰減 */
  damageFlashAlpha: 0.75,

  // 重疊判定 (原版 |dx| <= 200 AND |dy| <= 60)
  overlapDx: 200,
  overlapDy: 60,

  // HP
  maxHP: 12,
  spikeDamage: 5,
  ceilingDamage: 5,
  /** 在天花板殺傷區內,每 40ms 扣一次(對齊原版 25fps 的扣血節奏) */
  ceilingDamageIntervalSec: 0.04,

  // 速度遞增門檻;原版以「man.stair」(顯示分數)為輸入
  speedTiers: [
    { stair: 0, speed: 175 }, //  7 px/frame * 25fps
    { stair: 20, speed: 200 }, //  8 * 25
    { stair: 35, speed: 225 }, //  9 * 25
    { stair: 50, speed: 250 }, // 10 * 25
    { stair: 65, speed: 300 }, // 12 * 25
    { stair: 80, speed: 350 }, // 14 * 25
    { stair: 95, speed: 375 }, // 15 * 25
  ] as const,

  /** 站在彈簧階上時水平速度 ×1.5(原版 ms*1.5) */
  springSpeedMul: 1.5,

  // 計分:原版用 stair frame counter,man.stair = floor(stair/70)
  // 25fps 下 70 frame = 2.8s,所以 1 分 ≈ 存活 2.8 秒
  secPerScorePoint: 2.8,

  /** 碎裂階被踩到後多久消失 */
  crumbleDurationSec: 0.5,
  /** 翻轉階被踩到後多久翻過去丟下玩家 */
  flipDurationSec: 0.4,

  // 彈簧本身的「壓扁→回彈→晃動衰減」動畫:用阻尼餘弦
  //   scaleY(t) = 1 - A * exp(-k*t) * cos(omega*t)
  // t=0: scaleY = 1 - A = 0.45(壓扁)
  // 第一次回彈時間 ≈ pi/omega
  /** 彈簧整段動畫長度;之後 scaleY 視為已收斂回 1 */
  springAnimDuration: 0.5,
  /** 阻尼餘弦初始振幅 A;A 越大壓得越扁 */
  springAnimAmp: 0.55,
  /** 阻尼餘弦衰減 k;k 越大震盪越快收斂 */
  springAnimDecay: 8,
  /** 阻尼餘弦角頻率 omega;決定震盪一輪要多久 */
  springAnimOmega: 21,
} as const;

export type Stair = {
  id: number;
  /** 左緣 x */
  x: number;
  /** 上緣 y */
  y: number;
  type: StairType;
  /** 滾輪方向(僅 conveyor 有意義) */
  conveyorDir?: ConveyorDir;
  /** 碎裂 / 翻轉階被踩到的時刻(elapsedSec);undefined = 還沒被觸發 */
  triggeredAtSec?: number;
  /** 彈簧階「最近一次被踩」的時刻;用來驅動壓扁→回彈動畫 */
  pressedAtSec?: number;
};

/** 音效種類 */
export type SoundKind = 'spring' | 'spike' | 'crumble' | 'flip' | 'ceiling';

/** 角色狀態:-1 左、0 idle、1 右 */
export type CharState = -1 | 0 | 1;

export type Character = {
  /** 中心 x */
  x: number;
  /** 上緣 y(對應 NS-SHAFT 的 man.y,top-left 座標) */
  y: number;
  /** 垂直速度 (px/s);0 = 站著、+ve = 下墜、-ve = 彈跳上升中 */
  vy: number;
  facing: -1 | 1;
  state: CharState;
  /** 彈跳動畫計時(秒);-1 = 沒在彈跳,>=0 = 從接觸彈簧那一幀起累計 */
  bounceAnim: number;
};

/** 預載的圖片(僅在 client 端建立)— 只剩場景用圖,角色已改成全 procedural */
export type Images = {
  bg: HTMLImageElement;
  top: HTMLImageElement;
  block: HTMLImageElement;
  spring: HTMLImageElement;
  /** 滾輪階梯的底圖(原版 spic.jpg,我們把它再加方向箭頭使用) */
  conveyor: HTMLImageElement;
};
