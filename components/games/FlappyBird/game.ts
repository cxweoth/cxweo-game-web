// 跳跳鳥 — 世界狀態與每幀推進
//
// 整個 world 在單一 ref 物件內變動,React state 只管 status / score。
// tickWorld 回傳事件(過管 / 死亡)讓 hook 在外面處理。

import { CFG, type Cloud, type Fx, type Particle, type PipePair } from './types';

export type WorldStatus = 'idle' | 'playing' | 'dying' | 'dead';

export type World = {
  status: WorldStatus;
  /** 鳥的 y / vy。x 永遠是 CFG.birdX */
  birdY: number;
  birdVy: number;
  /** rad,根據 vy 算傾角:上升 −0.5、下降 +1.0 範圍 */
  birdAngle: number;

  pipes: PipePair[];
  clouds: Cloud[];
  particles: Particle[];

  /** 地面捲動偏移(顯示用,−groundCycle ≤ groundOffset ≤ 0) */
  groundOffset: number;
  /** 鳥在 idle 飄動的內建計時 */
  idleT: number;

  fx: Fx;
  score: number;
};

export type TickResult = {
  passed: number; // 本幀通過水管數(通常 0 或 1)
  died: boolean; // 本幀是否死亡
};

/** Linear congruential 不需要,直接用 Math.random;雲與管子位置都是顯示性質 */
function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function createWorld(): World {
  const clouds: Cloud[] = [];
  for (let i = 0; i < 4; i++) {
    clouds.push({
      x: rand(0, CFG.width),
      y: rand(40, 220),
      scale: rand(0.7, 1.2),
    });
  }
  return {
    status: 'idle',
    birdY: CFG.birdStartY,
    birdVy: 0,
    birdAngle: 0,
    pipes: [],
    clouds,
    particles: [],
    groundOffset: 0,
    idleT: 0,
    fx: { shakeT: 0, flashT: 0 },
    score: 0,
  };
}

/** 玩家拍翅;idle 第一次拍會直接進 playing */
export function flap(world: World): void {
  if (world.status === 'dead') return;
  if (world.status === 'idle') {
    world.status = 'playing';
    seedFirstPipes(world);
  }
  if (world.status === 'playing') {
    world.birdVy = CFG.jumpImpulse;
  }
}

function seedFirstPipes(world: World): void {
  // 第一根水管放在右側半屏外,讓玩家有反應時間
  const startX = CFG.width + 160;
  const count = 3;
  for (let i = 0; i < count; i++) {
    world.pipes.push({
      x: startX + i * CFG.pipeSpacing,
      gapY: rand(180, CFG.height - CFG.groundH - 180),
      passed: false,
    });
  }
}

function spawnDeathParticles(world: World): void {
  const cx = CFG.birdX;
  const cy = world.birdY;
  const colors = ['#fef08a', '#facc15', '#f97316', '#fde68a', '#ffffff'];
  for (let i = 0; i < 22; i++) {
    const a = (Math.PI * 2 * i) / 22 + rand(-0.2, 0.2);
    const speed = rand(120, 280);
    world.particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      age: 0,
      ttl: rand(0.5, 0.95),
      color: colors[i % colors.length] ?? '#ffffff',
    });
  }
}

/** 鳥的圓 vs 水管 AABB(取最近點)。pipe 上、下兩段都判。 */
function birdHitsPipe(world: World, pipe: PipePair): boolean {
  const bx = CFG.birdX;
  const by = world.birdY;
  const left = pipe.x - CFG.pipeW / 2;
  const right = pipe.x + CFG.pipeW / 2;
  const gapTop = pipe.gapY - CFG.pipeGap / 2;
  const gapBottom = pipe.gapY + CFG.pipeGap / 2;
  // 上管:y ∈ [0, gapTop]
  // 下管:y ∈ [gapBottom, height − groundH]
  const groundY = CFG.height - CFG.groundH;
  for (const seg of [
    { l: left, r: right, t: 0, b: gapTop },
    { l: left, r: right, t: gapBottom, b: groundY },
  ]) {
    const cx = Math.max(seg.l, Math.min(bx, seg.r));
    const cy = Math.max(seg.t, Math.min(by, seg.b));
    const dx = bx - cx;
    const dy = by - cy;
    if (dx * dx + dy * dy <= CFG.birdR * CFG.birdR) return true;
  }
  return false;
}

function currentPipeVx(score: number): number {
  // 每 10 分加速,封底 −260
  const accel = Math.floor(score / 10) * CFG.pipeAccelPer10;
  return Math.max(CFG.pipeMaxVx, CFG.pipeStartVx - accel);
}

/** 主 tick;dt 上限保護由呼叫端做(避免 tab 切回後巨幅跳) */
export function tickWorld(world: World, dt: number): TickResult {
  const result: TickResult = { passed: 0, died: false };

  // 雲不論狀態都飄
  for (const c of world.clouds) {
    c.x += CFG.cloudVx * dt * c.scale;
    if (c.x < -80) {
      c.x = CFG.width + rand(20, 120);
      c.y = rand(40, 220);
      c.scale = rand(0.7, 1.2);
    }
  }

  // 地面捲動 — playing/dying 才會動
  if (world.status === 'playing' || world.status === 'dying') {
    world.groundOffset += CFG.groundVx * dt;
    if (world.groundOffset < -32) world.groundOffset += 32;
  }

  // 粒子推進 + 衰減 — fx 有重力
  for (const p of world.particles) {
    p.vy += 600 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.age += dt;
  }
  world.particles = world.particles.filter((p) => p.age < p.ttl);

  // fx 計時
  if (world.fx.shakeT > 0) world.fx.shakeT = Math.max(0, world.fx.shakeT - dt);
  if (world.fx.flashT > 0) world.fx.flashT = Math.max(0, world.fx.flashT - dt);

  if (world.status === 'idle') {
    world.idleT += dt;
    // 上下飄動 ±10px
    world.birdY = CFG.birdStartY + Math.sin(world.idleT * 4) * 10;
    world.birdAngle = 0;
    return result;
  }

  if (world.status === 'dead') return result;

  // playing / dying — 鳥落體
  world.birdVy = Math.min(world.birdVy + CFG.gravity * dt, CFG.maxFallVy);
  world.birdY += world.birdVy * dt;
  // 傾角:vy 越大頭越下
  const t = (world.birdVy + 400) / 1100;
  world.birdAngle = Math.max(-0.5, Math.min(1.1, -0.5 + t * 1.6));

  // dying 期間:不再判管子、不再加分,等鳥落到地面才轉 dead
  const groundY = CFG.height - CFG.groundH;
  if (world.status === 'dying') {
    if (world.birdY >= groundY - CFG.birdR) {
      world.birdY = groundY - CFG.birdR;
      world.birdVy = 0;
      world.status = 'dead';
    }
    return result;
  }

  // playing — 水管前進、過管計分
  const vx = currentPipeVx(world.score);
  for (const pipe of world.pipes) {
    pipe.x += vx * dt;
    if (!pipe.passed && pipe.x < CFG.birdX) {
      pipe.passed = true;
      world.score += 1;
      result.passed += 1;
    }
  }
  // 移除離場的水管,並補新的在尾巴
  world.pipes = world.pipes.filter((p) => p.x > -CFG.pipeW);
  while (world.pipes.length < 3) {
    const last = world.pipes[world.pipes.length - 1];
    const baseX = last ? last.x : CFG.width + 160;
    world.pipes.push({
      x: baseX + CFG.pipeSpacing,
      gapY: rand(180, CFG.height - CFG.groundH - 180),
      passed: false,
    });
  }

  // 撞天花板 / 撞地面 / 撞水管 → 死
  let hit = false;
  if (world.birdY - CFG.birdR < CFG.ceilingY) {
    world.birdY = CFG.ceilingY + CFG.birdR;
    world.birdVy = 0; // 撞天花板不彈回去
    hit = true;
  }
  if (world.birdY + CFG.birdR >= groundY) {
    hit = true;
  }
  if (!hit) {
    for (const pipe of world.pipes) {
      if (Math.abs(pipe.x - CFG.birdX) > CFG.pipeW / 2 + CFG.birdR + 4) continue;
      if (birdHitsPipe(world, pipe)) {
        hit = true;
        break;
      }
    }
  }

  if (hit) {
    world.status = 'dying';
    world.birdVy = Math.max(world.birdVy, -120); // 死的瞬間給一點上彈
    world.fx.shakeT = 0.32;
    world.fx.flashT = 0.18;
    spawnDeathParticles(world);
    result.died = true;
  }

  return result;
}
