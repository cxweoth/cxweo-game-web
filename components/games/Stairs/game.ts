// 下樓梯遊戲核心邏輯 — 純函式,不持 React state。
//
// 嚴格照 NS-SHAFT 原版的事件序列:
//   1. 處理水平輸入(用上一幀計算出的 charSpeed)
//   2. 全部 stair 往上捲動
//   3. 偵測角色是否「踩在某階梯上」(up 檢查)
//   4. 套用結果:
//        up=1 → 吸附 + 階梯效果(可能改 charSpeed、扣血、回血、彈起、推走)
//        up=0 → 天花板檢查(扣血+夾位置)、定速下墜
//   5. 若角色掉出畫面底 → 判輸
//   6. y <= 30 的階梯重生到下方(類型不變)

import { clamp } from '@/lib/utils';
import {
  CFG,
  type Character,
  type ConveyorDir,
  type SoundKind,
  type Stair,
  type StairType,
} from './types';

export type World = {
  char: Character;
  stairs: Stair[];
  /** 上一幀有沒有 up=1;NS-SHAFT 的 flag,只用來判定「first contact」 */
  onStairLastFrame: boolean;
  /** 上一幀計算出的角色水平速度;本幀輸入用 */
  charSpeed: number;
  /** 累計遊戲時間(秒) */
  elapsedSec: number;
  /** 已回報過的分數;與 floor(elapsedSec/2.8) 比對,差值才 dispatch */
  scoreReported: number;
  /** 走路動畫累計時間 */
  walkAnim: number;
  /** 在天花板殺傷區的扣血計時器(下次扣血還需多少秒) */
  ceilingDamageTimer: number;
  nextStairId: number;
  /** 最近一次受傷的時刻(elapsedSec);renderer 用來閃紅色;-10 = 從沒受傷過 */
  lastDamageAtSec: number;
};

/** 10 個固定 slot 的階梯類型;6 種對齊原版 NS-SHAFT 經典版 */
const SLOT_TYPES: ReadonlyArray<{ type: StairType; conveyorDir?: ConveyorDir }> = [
  { type: 'normal' }, // 0:出生固定點
  { type: 'crumbling' }, // 1:碎裂階(踩一下就碎)
  { type: 'spike' }, // 2
  { type: 'conveyor', conveyorDir: 'left' }, // 3:滾輪向左
  { type: 'flip' }, // 4:翻轉階(踩一下會翻過去)
  { type: 'spring' }, // 5
  { type: 'normal' }, // 6
  { type: 'spike' }, // 7
  { type: 'normal' }, // 8
  { type: 'conveyor', conveyorDir: 'right' }, // 9:滾輪向右
];

function overlapsAny(stairs: Stair[], x: number, y: number, exceptId: number): boolean {
  for (const s of stairs) {
    if (s.id === exceptId) continue;
    if (Math.abs(s.x - x) <= CFG.overlapDx && Math.abs(s.y - y) <= CFG.overlapDy) return true;
  }
  return false;
}

export function createWorld(): World {
  const w: World = {
    char: {
      x: CFG.charXInit,
      y: CFG.charYInit,
      vy: 0,
      facing: 1,
      state: 0,
      bounceAnim: -1,
    },
    stairs: [],
    onStairLastFrame: false,
    charSpeed: CFG.charSpeedKey,
    elapsedSec: 0,
    scoreReported: 0,
    walkAnim: 0,
    ceilingDamageTimer: 0,
    nextStairId: 1,
    lastDamageAtSec: -10,
  };
  // Slot 0:NS-SHAFT 的 Array[0] = block(150, 600)
  w.stairs.push({ id: w.nextStairId++, x: 150, y: 600, type: 'normal' });
  // Slot 1..9:y = (random*10 + 10 + i*4)*40,x = random*480 - 100,避開重疊
  for (let i = 1; i < CFG.stairCount; i++) {
    const slot = SLOT_TYPES[i] ?? { type: 'normal' as StairType };
    let x = 0;
    let y = 0;
    for (let attempt = 0; attempt < 100; attempt++) {
      x = Math.random() * CFG.width - 100;
      y = (Math.random() * 10 + 10 + i * 4) * 40;
      if (!overlapsAny(w.stairs, x, y, -1)) break;
    }
    w.stairs.push({
      id: w.nextStairId++,
      x,
      y,
      type: slot.type,
      conveyorDir: slot.conveyorDir,
    });
  }
  return w;
}

function respawnStair(world: World, s: Stair): void {
  // NS-SHAFT 公式:y = height + (random*10+1)*(random*50+50) + 200
  // x = random * width - 100
  // 重生時清掉碎裂 / 翻轉 / 彈簧 的觸發狀態,新位置又是新階。
  s.triggeredAtSec = undefined;
  s.pressedAtSec = undefined;
  for (let attempt = 0; attempt < 100; attempt++) {
    const x = Math.random() * CFG.width - 100;
    const y = CFG.height + (Math.random() * 10 + 1) * (Math.random() * 50 + 50) + 200;
    if (!overlapsAny(world.stairs, x, y, s.id)) {
      s.x = x;
      s.y = y;
      return;
    }
  }
  s.x = Math.random() * CFG.width - 100;
  s.y = CFG.height + 800;
}

/**
 * 階梯目前是不是「已壞掉」(碎裂消失 / 翻轉完丟人)。壞掉的階梯不能踩。
 */
function isStairBroken(s: Stair, currentSec: number): boolean {
  if (s.triggeredAtSec === undefined) return false;
  const elapsed = currentSec - s.triggeredAtSec;
  if (s.type === 'crumbling') return elapsed >= CFG.crumbleDurationSec;
  if (s.type === 'flip') return elapsed >= CFG.flipDurationSec;
  return false;
}

/**
 * 角色是否踩在這塊階梯上。
 * 對齊 NS-SHAFT 的條件:
 *   man.y <= stair.y && man.y >= stair.y - 40
 *   man.x > stair.x - 20 && man.x < stair.x + 150
 * 這裡 char.x 是中心(原版 man.x 是 top-left,差 20),所以 X 條件換算為:
 *   char.x > stair.x && char.x < stair.x + 170
 */
function isOnStair(c: Character, s: Stair, currentSec: number): boolean {
  if (isStairBroken(s, currentSec)) return false;
  if (c.y < s.y - CFG.charH || c.y > s.y) return false;
  if (c.x <= s.x || c.x >= s.x + CFG.stairW + 20) return false;
  return true;
}

function currentScrollSpeed(score: number): number {
  let speed: number = CFG.speedTiers[0].speed;
  for (const tier of CFG.speedTiers) {
    if (score > tier.stair) speed = tier.speed;
  }
  return speed;
}

export function tickPhysics(
  world: World,
  dt: number,
  alive: boolean,
  keys: ReadonlySet<string>,
  mouseTargetX: number | null,
  onDamage: (amount: number) => void,
  onScore: (delta: number) => void,
  onHeal: (amount: number) => void,
  onSound: (kind: SoundKind) => void,
): void {
  if (!alive) return;

  // 1) 計時 + 報分
  world.elapsedSec += dt;
  const score = Math.floor(world.elapsedSec / CFG.secPerScorePoint);
  if (score > world.scoreReported) {
    onScore(score - world.scoreReported);
    world.scoreReported = score;
  }

  // 2) 水平輸入(以上一幀的 charSpeed 計算)
  let movedDir: -1 | 0 | 1 = 0;
  if (keys.has('ArrowLeft') || keys.has('KeyA')) {
    world.char.x -= world.charSpeed * dt;
    movedDir = -1;
  } else if (keys.has('ArrowRight') || keys.has('KeyD')) {
    world.char.x += world.charSpeed * dt;
    movedDir = 1;
  } else if (mouseTargetX !== null) {
    const dx = mouseTargetX - world.char.x;
    const maxStep = world.charSpeed * dt;
    if (Math.abs(dx) > 2) {
      if (Math.abs(dx) > maxStep) world.char.x += Math.sign(dx) * maxStep;
      else world.char.x = mouseTargetX;
      movedDir = dx > 0 ? 1 : -1;
    }
  }
  world.char.x = clamp(world.char.x, CFG.charW / 2, CFG.width - CFG.charW / 2);
  world.char.state = movedDir;
  if (movedDir !== 0) world.char.facing = movedDir;
  world.walkAnim = movedDir !== 0 ? world.walkAnim + dt : 0;

  // 3) 樓梯捲動
  const scrollSpeed = currentScrollSpeed(score);
  for (const s of world.stairs) s.y -= scrollSpeed * dt;

  // 4) 偵測 up(會跳過已碎裂 / 翻轉完成的壞階)
  let onStair: Stair | null = null;
  for (const s of world.stairs) {
    if (isOnStair(world.char, s, world.elapsedSec)) {
      onStair = s;
      break;
    }
  }

  // 5) 套效果
  if (onStair) {
    world.char.y = onStair.y - CFG.charH;
    world.char.vy = 0; // 落地清速;彈簧 case 會再蓋成負值
    const firstContact = !world.onStairLastFrame;
    switch (onStair.type) {
      case 'normal':
        if (firstContact) onHeal(1);
        world.charSpeed = CFG.charSpeedKey;
        break;
      case 'spike':
        if (firstContact) {
          onDamage(CFG.spikeDamage);
          onSound('spike');
        }
        world.charSpeed = CFG.charSpeedKey;
        break;
      case 'spring':
        world.charSpeed = CFG.charSpeedKey * CFG.springSpeedMul;
        if (firstContact) {
          onHeal(1);
          onSound('spring');
          // 起跳:給上拋初速度 + 立刻把人推離 on-stair 範圍,
          // 之後 air 分支會用 gravity 把 vy 慢慢拉回 → 連續拋物線。
          world.char.vy = -CFG.bounceVy;
          world.char.y -= CFG.bounceLift;
          // 開啟彈跳動畫;bounceAnim=0 對應壓扁那一幀,接著進入拉長相位
          world.char.bounceAnim = 0;
          // 同步觸發彈簧本身的壓扁→回彈動畫
          onStair.pressedAtSec = world.elapsedSec;
        }
        break;
      case 'conveyor': {
        if (firstContact) onHeal(1);
        world.charSpeed = CFG.charSpeedKey;
        const dir = onStair.conveyorDir === 'left' ? -1 : 1;
        world.char.x += dir * CFG.conveyorSpeed * dt;
        world.char.x = clamp(world.char.x, CFG.charW / 2, CFG.width - CFG.charW / 2);
        break;
      }
      case 'crumbling':
        if (firstContact) {
          onHeal(1);
          onStair.triggeredAtSec = world.elapsedSec;
          onSound('crumble');
        }
        world.charSpeed = CFG.charSpeedKey;
        break;
      case 'flip':
        if (firstContact) {
          onHeal(1);
          onStair.triggeredAtSec = world.elapsedSec;
          onSound('flip');
        }
        world.charSpeed = CFG.charSpeedKey;
        break;
    }
    world.onStairLastFrame = true;
    world.ceilingDamageTimer = 0; // 落地時重置
    // 落到非彈簧階就立刻收回彈跳動畫(踩到普通階要回到走路 / idle 樣)
    if (onStair.type !== 'spring') world.char.bounceAnim = -1;
  } else {
    // 在空中:重力施加於 vy,封頂在 fallSpeed(終端速度)
    if (world.char.y < CFG.ceilingY) {
      world.char.y = CFG.ceilingY;
      if (world.char.vy < 0) world.char.vy = 0; // 撞天花板停止上升
      if (world.ceilingDamageTimer <= 0) {
        onDamage(CFG.ceilingDamage);
        onSound('ceiling');
        world.ceilingDamageTimer = CFG.ceilingDamageIntervalSec;
      } else {
        world.ceilingDamageTimer -= dt;
      }
    } else {
      world.ceilingDamageTimer = 0;
    }
    world.char.vy = Math.min(world.char.vy + CFG.gravity * dt, CFG.fallSpeed);
    world.char.y += world.char.vy * dt;
    world.charSpeed = CFG.charSpeedKey;
    world.onStairLastFrame = false;
  }

  // 推進彈跳動畫計時器;超過 duration 自動關掉
  if (world.char.bounceAnim >= 0) {
    world.char.bounceAnim += dt;
    if (world.char.bounceAnim > CFG.bounceAnimDuration) world.char.bounceAnim = -1;
  }

  // 6) 跌出底部 → 判輸(直接扣滿 HP)
  if (world.char.y > CFG.height) {
    onDamage(CFG.maxHP);
    return;
  }

  // 7) 重生捲過頂的階梯(類型不變)
  for (const s of world.stairs) {
    if (s.y <= 30) respawnStair(world, s);
  }
}
