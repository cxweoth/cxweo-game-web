// 小蜜蜂遊戲核心邏輯 — 純函式,不持 React state。
//
// 每幀順序:
//   1. 玩家輸入 → 移動 / 射擊
//   2. 子彈位移 + 出界回收
//   3. 蜜蜂方陣整體擺動(碰邊緣反向 + 下沉)— swarm.ts
//   4. 俯衝中蜜蜂直線飛 + 偶爾丟炸彈;衝出底部 → 從上面歸隊 — swarm.ts
//   5. 子彈 ↔ 蜜蜂 AABB 碰撞:扣血、計分、回收子彈
//   6. 蜜蜂 / 炸彈 ↔ 玩家 AABB 碰撞:扣命 + 開無敵
//   7. 隨機觸發新一波俯衝 — swarm.ts
//   8. 若全滅 → 開新一波

import { clamp } from '@/lib/utils';
import {
  CFG,
  type Bee,
  type Bomb,
  type Bullet,
  type Ship,
  type SoundKind,
} from './types';
import {
  scheduleNextDive,
  spawnWave,
  tickDivers,
  tickSwarm,
  type SwarmContext,
} from './swarm';

export type World = {
  ship: Ship;
  bees: Bee[];
  bullets: Bullet[];
  bombs: Bomb[];
  swarmX: number;
  swarmY: number;
  swarmDir: 1 | -1;
  elapsedSec: number;
  lastShootSec: number;
  nextDiveSec: number;
  wave: number;
  nextBeeId: number;
  /** 最近一次受傷的時刻 — 給 renderer 算閃紅 alpha */
  lastDamageAtSec: number;
};

export function createWorld(): World {
  const w: World = {
    ship: { x: CFG.width / 2, y: CFG.shipY, invuln: 0 },
    bees: [],
    bullets: [],
    bombs: [],
    swarmX: 0,
    swarmY: 0,
    swarmDir: 1,
    elapsedSec: 0,
    lastShootSec: -10,
    nextDiveSec: 1.2,
    wave: 1,
    nextBeeId: 1,
    lastDamageAtSec: -10,
  };
  spawnWave(asSwarmCtx(w));
  return w;
}

/** World 是 SwarmContext 的超集合;swarm.ts 用 ship 位置算俯衝目標 */
function asSwarmCtx(w: World): SwarmContext {
  return Object.assign(w, { shipX: w.ship.x, shipY: w.ship.y });
}

function aabb(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function tickPhysics(
  world: World,
  dt: number,
  alive: boolean,
  keys: ReadonlySet<string>,
  pointerX: number | null,
  shootRequested: boolean,
  onScore: (delta: number) => void,
  onDamage: () => void,
  onSound: (kind: SoundKind) => void,
): void {
  if (!alive) return;
  world.elapsedSec += dt;

  tickShip(world, dt, keys, pointerX, shootRequested, onSound);
  tickBullets(world, dt);
  const ctx = asSwarmCtx(world);
  tickSwarm(ctx, dt);
  tickDivers(ctx, dt);
  tickBombs(world, dt);
  tickBulletHits(world, onScore, onSound);
  tickShipHits(world, onDamage, onSound);
  scheduleNextDive(ctx);

  if (world.bees.length === 0) {
    onScore(CFG.scoreClearWaveBonus);
    onSound('wave');
    world.wave += 1;
    spawnWave(ctx);
    // 下一波整體下移,難度漸增
    world.swarmY = Math.min((world.wave - 1) * 8, 60);
  }
}

function tickShip(
  w: World,
  dt: number,
  keys: ReadonlySet<string>,
  pointerX: number | null,
  shootRequested: boolean,
  onSound: (kind: SoundKind) => void,
): void {
  let dir = 0;
  if (keys.has('ArrowLeft') || keys.has('KeyA')) dir = -1;
  else if (keys.has('ArrowRight') || keys.has('KeyD')) dir = 1;

  if (dir !== 0) {
    w.ship.x += dir * CFG.shipSpeed * dt;
  } else if (pointerX !== null) {
    const dx = pointerX - w.ship.x;
    const maxStep = CFG.shipSpeed * dt;
    if (Math.abs(dx) > 2) {
      w.ship.x += Math.sign(dx) * Math.min(Math.abs(dx), maxStep);
    } else {
      w.ship.x = pointerX;
    }
  }
  w.ship.x = clamp(w.ship.x, CFG.shipW / 2, CFG.width - CFG.shipW / 2);

  if (w.ship.invuln > 0) w.ship.invuln -= dt;

  if (shootRequested) {
    const cooldownReady = w.elapsedSec - w.lastShootSec >= CFG.shootCooldown;
    const liveCount = w.bullets.filter((b) => b.alive).length;
    if (cooldownReady && liveCount < CFG.maxBullets) {
      w.lastShootSec = w.elapsedSec;
      const slot = w.bullets.find((b) => !b.alive);
      const bullet: Bullet = { x: w.ship.x, y: w.ship.y - CFG.shipH / 2, alive: true };
      if (slot) Object.assign(slot, bullet);
      else w.bullets.push(bullet);
      onSound('shoot');
    }
  }
}

function tickBullets(w: World, dt: number): void {
  for (const b of w.bullets) {
    if (!b.alive) continue;
    b.y -= CFG.bulletSpeed * dt;
    if (b.y + CFG.bulletH < 0) b.alive = false;
  }
}

function tickBombs(w: World, dt: number): void {
  for (const b of w.bombs) {
    if (!b.alive) continue;
    b.y += CFG.bombSpeed * dt;
    if (b.y > CFG.height + 10) b.alive = false;
  }
}

function tickBulletHits(
  w: World,
  onScore: (delta: number) => void,
  onSound: (kind: SoundKind) => void,
): void {
  for (const bullet of w.bullets) {
    if (!bullet.alive) continue;
    for (const bee of w.bees) {
      if (!bee.alive) continue;
      if (
        aabb(
          bullet.x - CFG.bulletW / 2,
          bullet.y,
          CFG.bulletW,
          CFG.bulletH,
          bee.x,
          bee.y,
          CFG.beeW,
          CFG.beeH,
        )
      ) {
        bullet.alive = false;
        bee.alive = false;
        onScore(bee.state === 'diving' ? CFG.scoreDivingBee : CFG.scoreStandingBee);
        onSound('explode');
        break;
      }
    }
  }
  for (let i = w.bees.length - 1; i >= 0; i--) {
    const b = w.bees[i];
    if (b && !b.alive) w.bees.splice(i, 1);
  }
}

function tickShipHits(
  w: World,
  onDamage: () => void,
  onSound: (kind: SoundKind) => void,
): void {
  if (w.ship.invuln > 0) return;
  const sx = w.ship.x - CFG.shipW / 2;
  const sy = w.ship.y - CFG.shipH / 2;

  for (const bee of w.bees) {
    if (!bee.alive) continue;
    if (bee.state === 'formation') continue;
    if (aabb(sx, sy, CFG.shipW, CFG.shipH, bee.x, bee.y, CFG.beeW, CFG.beeH)) {
      bee.alive = false;
      damageShip(w, onDamage, onSound);
      return;
    }
  }
  for (const bomb of w.bombs) {
    if (!bomb.alive) continue;
    if (aabb(sx, sy, CFG.shipW, CFG.shipH, bomb.x - CFG.bombW / 2, bomb.y, CFG.bombW, CFG.bombH)) {
      bomb.alive = false;
      damageShip(w, onDamage, onSound);
      return;
    }
  }
}

function damageShip(
  w: World,
  onDamage: () => void,
  onSound: (kind: SoundKind) => void,
): void {
  w.ship.invuln = CFG.invulnDuration;
  w.lastDamageAtSec = w.elapsedSec;
  onDamage();
  onSound('hit');
}
