// 跳躍王 — 世界狀態 + 物理
//
// 世界向上無限延伸:每當 cameraY 上升,丟棄離開下方視窗的平台、補上方新平台。

import { CFG, type Particle, type Platform, type PlatformKind } from './types';

export type World = {
  /** 玩家世界座標(中心) */
  px: number;
  py: number;
  pvx: number;
  pvy: number;
  /** 朝向(影響繪畫翻面) */
  facing: 1 | -1;

  platforms: Platform[];
  particles: Particle[];

  /** 鏡頭世界 y;螢幕上 y=0 對應世界 y=cameraY。只會單向下降(向上看)。 */
  cameraY: number;
  /** 已生成到的最高(最小 y)世界 y */
  highestY: number;
  /** 玩家曾抵達的最高點(用來算分) */
  bestY: number;

  alive: boolean;
};

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** 隨高度變難:越上面越多 moving / breakable / spring;normal 比例下降 */
function randomKindAtHeight(climbed: number): PlatformKind {
  const r = Math.random();
  // climbed:玩家爬升的距離(>=0);用來逐步調整機率
  const movingP = Math.min(0.18 + climbed / 12000, 0.32);
  const breakableP = Math.min(0.06 + climbed / 16000, 0.18);
  const springP = 0.05;
  const c1 = movingP;
  const c2 = c1 + breakableP;
  const c3 = c2 + springP;
  if (r < c1) return 'moving';
  if (r < c2) return 'breakable';
  if (r < c3) return 'spring';
  return 'normal';
}

export function createWorld(): World {
  const w: World = {
    px: CFG.width / 2,
    py: 540,
    pvx: 0,
    pvy: 0,
    facing: 1,
    platforms: [],
    particles: [],
    cameraY: 0,
    highestY: 540,
    bestY: 540,
    alive: true,
  };
  // 起手平台(寬一點 + 在玩家正下方),保證第一跳不會死
  w.platforms.push({
    x: CFG.width / 2 - CFG.platW / 2,
    y: CFG.startPlatY,
    w: CFG.platW,
    kind: 'normal',
  });
  // 往上預生成
  fillPlatformsUpTo(w, -200);
  return w;
}

/** 確保上方有足夠平台,直到 targetY(世界 y;越小越上) */
export function fillPlatformsUpTo(world: World, targetY: number): void {
  while (world.highestY > targetY) {
    const nextY = world.highestY - rand(CFG.platVStep - 14, CFG.platVStep + 14);
    const climbed = Math.max(0, 580 - nextY);
    const kind = randomKindAtHeight(climbed);
    const x = rand(8, CFG.width - CFG.platW - 8);
    const p: Platform = {
      x,
      y: nextY,
      w: CFG.platW,
      kind,
    };
    if (kind === 'moving') p.vx = rand(40, 90) * (Math.random() < 0.5 ? -1 : 1);
    world.platforms.push(p);
    world.highestY = nextY;
  }
}

function spawnBreakParticles(world: World, plat: Platform): void {
  for (let i = 0; i < 10; i++) {
    world.particles.push({
      x: plat.x + plat.w * Math.random(),
      y: plat.y,
      vx: (Math.random() - 0.5) * 200,
      vy: rand(-120, 0),
      age: 0,
      ttl: rand(0.5, 0.9),
      color: '#a16207',
    });
  }
}

/** 玩家物件 AABB:中心 (px, py),寬高 playerW/playerH */
function playerFeetY(world: World): number {
  return world.py + CFG.playerH / 2;
}

/**
 * 跟單一平台做「自上而下」碰撞檢查:
 * 只在「玩家正在下落 (vy > 0)」且「腳離開上一格 ≤ vy*dt + 4」內成立。
 */
function tryLand(world: World, p: Platform, dt: number): boolean {
  if (!world.alive) return false;
  if (world.pvy <= 0) return false;
  const feet = playerFeetY(world);
  const prevFeet = feet - world.pvy * dt;
  // 玩家水平範圍
  const left = world.px - CFG.playerW / 2;
  const right = world.px + CFG.playerW / 2;
  if (right < p.x || left > p.x + p.w) return false;
  // 上一幀腳必須在平台 y 之上,這幀腳在或穿過 y
  if (prevFeet > p.y + 1) return false;
  if (feet < p.y - 0.5) return false;
  return true;
}

export function tickWorld(world: World, dt: number): void {
  if (!world.alive) {
    // 死後仍推進粒子讓動畫播完,但不再判碰撞
    advanceParticles(world, dt);
    return;
  }

  // 玩家移動:水平
  world.px += world.pvx * dt;
  if (world.px < -CFG.playerW / 2) world.px = CFG.width + CFG.playerW / 2 - 1;
  if (world.px > CFG.width + CFG.playerW / 2) world.px = -CFG.playerW / 2 + 1;

  // 重力
  world.pvy += CFG.gravity * dt;
  world.py += world.pvy * dt;
  if (world.pvx > 5) world.facing = 1;
  else if (world.pvx < -5) world.facing = -1;

  // 平台動作
  for (const p of world.platforms) {
    if (p.kind === 'moving' && p.vx !== undefined) {
      p.x += p.vx * dt;
      if (p.x < 4) {
        p.x = 4;
        p.vx = -p.vx;
      } else if (p.x + p.w > CFG.width - 4) {
        p.x = CFG.width - 4 - p.w;
        p.vx = -p.vx;
      }
    }
    if (p.spring !== undefined) {
      p.spring = Math.max(0, p.spring - dt * 4);
    }
  }

  // 落地判定 — 只在下落時起作用
  for (const p of world.platforms) {
    if (p.broken) continue;
    if (!tryLand(world, p, dt)) continue;
    // 立刻把玩家對齊平台
    world.py = p.y - CFG.playerH / 2;
    if (p.kind === 'breakable') {
      p.broken = true;
      spawnBreakParticles(world, p);
      // 不彈,直接繼續往下落
      world.pvy = Math.max(world.pvy, 60);
    } else if (p.kind === 'spring') {
      world.pvy = CFG.springVy;
      p.spring = 1;
    } else {
      world.pvy = CFG.jumpVy;
    }
    break;
  }

  // 攝影機:玩家高過 upperRatio*height(換算到螢幕)時把鏡頭跟著上推
  const screenY = world.py - world.cameraY;
  const threshold = CFG.height * CFG.upperRatio;
  if (screenY < threshold) {
    world.cameraY = world.py - threshold;
  }

  // 用世界 y 算分:bestY 越小代表爬越高
  if (world.py < world.bestY) world.bestY = world.py;

  // 補上方平台
  fillPlatformsUpTo(world, world.cameraY - 60);
  // 移除離開螢幕下方的平台
  world.platforms = world.platforms.filter((p) => p.y - world.cameraY < CFG.height + 80);

  // 死亡:玩家落到螢幕下緣以下(腳)
  if (world.py - world.cameraY > CFG.height + CFG.playerH) {
    world.alive = false;
  }

  advanceParticles(world, dt);
}

function advanceParticles(world: World, dt: number): void {
  for (const p of world.particles) {
    p.vy += 600 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.age += dt;
  }
  world.particles = world.particles.filter((p) => p.age < p.ttl);
}

/** 給 hook 用:目前分數 */
export function score(world: World): number {
  // 540 是初始 py,差距 / 4 取整當分數,讓數字成長慢一點
  return Math.max(0, Math.floor((540 - world.bestY) / 4));
}
