// 每幀物理：玩家移動、怪物 AI、碰撞、粒子。
// Canvas 元件只負責 React 整合（refs、事件、rAF 排程），
// 真正的世界更新邏輯都在這裡。

import { clamp } from '@/lib/utils';
import { spawnParticles, updateParticles } from './fx';
import {
  CFG,
  type Arrow,
  type DeathFx,
  type Fireball,
  type Particle,
  type Shake,
} from './types';

/** 世界狀態 — 所有「會在每一幀變動」的東西集中在這 */
export type World = {
  playerY: number;
  monsterY: number;
  monsterTargetY: number;
  arrows: Arrow[];
  fireballs: Fireball[];
  particles: Particle[];
  monsterFlashUntil: number;
  playerFlashUntil: number;
  monsterRetargetTimer: number;
  monsterShootTimer: number;
  shake: Shake | null;
  monsterDeath: DeathFx | null;
  playerDeath: DeathFx | null;
  lastShotMs: number;
};

export function createWorld(): World {
  return {
    playerY: CFG.playerYInit,
    monsterY: CFG.monsterYInit,
    monsterTargetY: CFG.monsterYInit,
    arrows: [],
    fireballs: [],
    particles: [],
    monsterFlashUntil: 0,
    playerFlashUntil: 0,
    monsterRetargetTimer: CFG.monsterRetargetMs,
    monsterShootTimer: CFG.monsterShootMs,
    shake: null,
    monsterDeath: null,
    playerDeath: null,
    lastShotMs: 0,
  };
}

/** 怪物 / 玩家剛剛從 HP > 0 → 0：產生死亡特效 */
export function triggerMonsterDeath(world: World, nowMs: number): void {
  const x = CFG.monsterX;
  const y = world.monsterY;
  world.monsterDeath = { startMs: nowMs, x, y, side: 'monster' };
  spawnParticles(world.particles, x, y, 'monster');
  world.shake = { startMs: nowMs, durationMs: 380, intensity: 10 };
}

export function triggerPlayerDeath(world: World, nowMs: number): void {
  const x = CFG.playerX;
  const y = world.playerY;
  world.playerDeath = { startMs: nowMs, x, y, side: 'player' };
  spawnParticles(world.particles, x, y, 'player');
  world.shake = { startMs: nowMs, durationMs: 380, intensity: 10 };
}

/** 玩家手動射出一箭 — 受冷卻限制 */
export function tryShootArrow(world: World, nowMs: number): void {
  if (nowMs - world.lastShotMs < CFG.arrowCooldownMs) return;
  world.lastShotMs = nowMs;
  world.arrows.push({
    x: CFG.playerX + 22,
    y: world.playerY,
    vx: CFG.arrowSpeed,
    dead: false,
  });
}

/**
 * 一幀的世界推進。回呼 onMonsterHit / onPlayerHit 讓 React 同步 HP。
 * 即使 status === 'gameOver' 也會繼續更新粒子，讓死亡特效跑完。
 */
export function tickPhysics(
  world: World,
  dt: number,
  nowMs: number,
  alive: boolean,
  keys: ReadonlySet<string>,
  onMonsterHit: () => void,
  onPlayerHit: () => void,
): void {
  if (alive) {
    // 玩家鍵盤移動
    if (keys.has('ArrowUp') || keys.has('KeyW')) world.playerY -= CFG.playerSpeedKey * dt;
    if (keys.has('ArrowDown') || keys.has('KeyS')) world.playerY += CFG.playerSpeedKey * dt;
    world.playerY = clamp(world.playerY, CFG.playerYMin, CFG.playerYMax);

    // 怪物移動：往目標 Y 直線靠近
    const diff = world.monsterTargetY - world.monsterY;
    world.monsterY += Math.sign(diff) * Math.min(Math.abs(diff), CFG.monsterSpeed * dt);

    // 怪物換目標
    world.monsterRetargetTimer -= dt * 1000;
    if (world.monsterRetargetTimer <= 0) {
      world.monsterTargetY =
        CFG.monsterYMin + Math.random() * (CFG.monsterYMax - CFG.monsterYMin);
      world.monsterRetargetTimer = CFG.monsterRetargetMs * (0.7 + Math.random() * 0.6);
    }

    // 怪物射火球（朝玩家當下位置）
    world.monsterShootTimer -= dt * 1000;
    if (world.monsterShootTimer <= 0) {
      const dx = CFG.playerX - CFG.monsterX;
      const dy = world.playerY - world.monsterY;
      const len = Math.hypot(dx, dy) || 1;
      world.fireballs.push({
        x: CFG.monsterX - CFG.monsterR + 4,
        y: world.monsterY,
        vx: (dx / len) * CFG.fireballSpeed,
        phase: 0,
        dead: false,
      });
      world.monsterShootTimer = CFG.monsterShootMs * (0.85 + Math.random() * 0.3);
    }

    // 投射物移動
    for (const a of world.arrows) a.x += a.vx * dt;
    for (const f of world.fireballs) {
      f.x += f.vx * dt;
      f.phase += dt;
    }

    // 碰撞：箭 vs 怪物
    const mr2 = (CFG.monsterR + 2) * (CFG.monsterR + 2);
    for (const a of world.arrows) {
      if (a.dead) continue;
      const dx2 = a.x - CFG.monsterX;
      const dy2 = a.y - world.monsterY;
      if (dx2 * dx2 + dy2 * dy2 < mr2) {
        a.dead = true;
        world.monsterFlashUntil = nowMs + 180;
        onMonsterHit();
      }
    }

    // 碰撞：火球 vs 玩家
    const fr2 = (CFG.fireballHitR + CFG.playerR) * (CFG.fireballHitR + CFG.playerR);
    for (const f of world.fireballs) {
      if (f.dead) continue;
      const dx2 = f.x - CFG.playerX;
      const dy2 = f.y - world.playerY;
      if (dx2 * dx2 + dy2 * dy2 < fr2) {
        f.dead = true;
        world.playerFlashUntil = nowMs + 200;
        onPlayerHit();
      }
    }
  }

  // 清理（即使結束也要做，免得殘留）
  world.arrows = world.arrows.filter((a) => !a.dead && a.x < CFG.width + 40);
  world.fireballs = world.fireballs.filter(
    (f) => !f.dead && f.x > -40 && f.y > -40 && f.y < CFG.height + 40,
  );
  // 粒子：即使結束也要繼續更新（讓死亡特效跑完）
  world.particles = updateParticles(world.particles, dt);
}

/** 把 Canvas 需要的所有「會被 drawScene 讀」的欄位導出（給 props 使用 World 內部） */
export type WorldView = Readonly<World>;
