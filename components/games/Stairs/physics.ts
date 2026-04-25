// 下樓梯每幀的世界更新。

import { clamp } from '@/lib/utils';
import { CFG, type Character, type Stair, type StairType } from './types';

export type World = {
  char: Character;
  stairs: Stair[];
  /** 角色「上一幀站著的」stair id（決定下一幀要不要跟著捲動） */
  onStairId: number | null;
  /** 累計捲動距離(像素),用來算分數與漸增速度 */
  scrolled: number;
  /** 已踩過的 id 集（避免重複計分） */
  steppedIds: Set<number>;
  /** 受擊紅閃終點（performance.now ms） */
  hurtFlashUntil: number;
  nextStairId: number;
};

function makeStair(world: World, y: number): Stair {
  const x = Math.random() * (CFG.width - CFG.stairW);
  const r = Math.random();
  const type: StairType =
    r < CFG.spikeChance
      ? 'spike'
      : r < CFG.spikeChance + CFG.fragileChance
        ? 'fragile'
        : 'normal';
  return { id: world.nextStairId++, x, y, w: CFG.stairW, type, broken: false };
}

export function createWorld(): World {
  const w: World = {
    char: {
      x: CFG.charXInit,
      y: CFG.charYInit,
      vy: 0,
      facing: 1,
      invulnUntil: 0,
    },
    stairs: [],
    onStairId: null,
    scrolled: 0,
    steppedIds: new Set(),
    hurtFlashUntil: 0,
    nextStairId: 1,
  };
  // 出生時先擺好幾階。第一階直接放在角色腳下，角色開局就站好。
  w.stairs.push({
    id: w.nextStairId++,
    x: CFG.charXInit - CFG.stairW / 2,
    y: CFG.charYInit + CFG.charH,
    w: CFG.stairW,
    type: 'normal',
    broken: false,
  });
  let y = CFG.charYInit + CFG.charH + CFG.stairSpacingMin;
  while (y < CFG.height + 60) {
    w.stairs.push(makeStair(w, y));
    y += CFG.stairSpacingMin + Math.random() * (CFG.stairSpacingMax - CFG.stairSpacingMin);
  }
  return w;
}

function currentScrollSpeed(scrolled: number): number {
  const t = Math.min(1, scrolled / (CFG.scrollDepthRamp * 100));
  return CFG.scrollSpeedStart + (CFG.scrollSpeedMax - CFG.scrollSpeedStart) * t;
}

/**
 * 一幀的世界推進。
 * - alive=false 時直接 return（不再動）。
 * - mouseX 非 null 時直接設定角色 x（含 clamp）。
 */
export function tickPhysics(
  world: World,
  dt: number,
  nowMs: number,
  alive: boolean,
  keys: ReadonlySet<string>,
  mouseX: number | null,
  onDamage: (amount: number) => void,
  onScore: (points: number) => void,
): void {
  if (!alive) return;

  // 1) 水平輸入
  if (mouseX !== null) {
    world.char.x = clamp(mouseX, CFG.charW / 2, CFG.width - CFG.charW / 2);
  }
  if (keys.has('ArrowLeft') || keys.has('KeyA')) {
    world.char.x -= CFG.charSpeedKey * dt;
    world.char.facing = -1;
  }
  if (keys.has('ArrowRight') || keys.has('KeyD')) {
    world.char.x += CFG.charSpeedKey * dt;
    world.char.facing = 1;
  }
  world.char.x = clamp(world.char.x, CFG.charW / 2, CFG.width - CFG.charW / 2);

  // 2) 上一幀站在 stair 上 → 角色跟著 stair 一起捲動
  const speed = currentScrollSpeed(world.scrolled);
  if (world.onStairId !== null) {
    world.char.y -= speed * dt;
  }

  // 3) 樓梯捲動
  for (const s of world.stairs) s.y -= speed * dt;
  world.scrolled += speed * dt;

  // 4) 重力
  const prevBottom = world.char.y + CFG.charH;
  world.char.vy = Math.min(world.char.vy + CFG.gravity * dt, CFG.maxVy);
  world.char.y += world.char.vy * dt;

  // 5) 落點偵測（只在下墜時、且本幀「跨過」stair 上緣才算）
  let landed: Stair | null = null;
  if (world.char.vy > 0) {
    const cl = world.char.x - CFG.charW / 2;
    const cr = world.char.x + CFG.charW / 2;
    const newBottom = world.char.y + CFG.charH;
    for (const s of world.stairs) {
      if (s.broken) continue;
      if (cr < s.x || cl > s.x + s.w) continue;
      if (prevBottom <= s.y && newBottom >= s.y) {
        if (!landed || s.y < landed.y) landed = s;
      }
    }
  }

  if (landed) {
    world.char.y = landed.y - CFG.charH;
    world.char.vy = 0;
    world.onStairId = landed.id;

    // 第一次踩上 → 計分 / 受擊 / 破裂
    if (!world.steppedIds.has(landed.id)) {
      world.steppedIds.add(landed.id);
      if (landed.type === 'spike') {
        if (nowMs > world.char.invulnUntil) {
          world.char.invulnUntil = nowMs + CFG.invulnMs;
          world.hurtFlashUntil = nowMs + 300;
          onDamage(1);
        }
      } else if (landed.type === 'fragile') {
        landed.broken = true;
        onScore(2);
      } else {
        onScore(1);
      }
    } else if (landed.type === 'fragile' && !landed.broken) {
      landed.broken = true;
    }
  } else {
    world.onStairId = null;
  }

  // 6) 天花板：直接判輸（扣滿 HP）
  if (world.char.y < CFG.ceilingY) {
    world.char.y = CFG.ceilingY;
    world.char.vy = 0;
    world.hurtFlashUntil = nowMs + 400;
    onDamage(CFG.maxHP);
    return;
  }

  // 7) 跌出底部：也判輸
  if (world.char.y > CFG.height + 80) {
    onDamage(CFG.maxHP);
    return;
  }

  // 8) 清掉已捲出畫面的 stair；補生畫面下方的 stair
  world.stairs = world.stairs.filter((s) => s.y > -CFG.stairH * 3);
  while (world.stairs.length < 12) {
    const last = world.stairs[world.stairs.length - 1];
    const lastY = last ? last.y : CFG.height;
    const y =
      lastY + CFG.stairSpacingMin + Math.random() * (CFG.stairSpacingMax - CFG.stairSpacingMin);
    if (y > CFG.height + 500) break;
    world.stairs.push(makeStair(world, y));
  }
}
