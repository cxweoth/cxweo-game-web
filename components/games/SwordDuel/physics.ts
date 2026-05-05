// 劍盾決鬥 — 世界更新(物理 + 攻擊判定)
//
// World 集中所有「每幀變動」的東西。HP 也放這裡(source of truth),
// React 端透過 callback 同步顯示。Canvas 元件只負責 React 整合。

import { clamp } from '@/lib/utils';
import { advanceAi, bossEnterDead, bossEnterHurt, bossIsGuarding, bossKnockback, bossSwingActive, createBoss } from './ai';
import {
  spawnBlockSparks,
  spawnDeathParticles,
  spawnFloatText,
  spawnHitParticles,
  updateFloatTexts,
  updateParticles,
} from './fx';
import {
  CFG,
  type BossState,
  type Facing,
  type FloatText,
  type Particle,
  type PlayerState,
  type Shake,
} from './types';

export type World = {
  player: PlayerState;
  boss: BossState;
  particles: Particle[];
  floatTexts: FloatText[];
  shake: Shake | null;
  bossHP: number;
  playerHP: number;
  bossDeathStartMs: number | null;
  playerDeathStartMs: number | null;
};

function createPlayer(): PlayerState {
  return {
    x: CFG.playerStartX,
    y: 0,
    vy: 0,
    grounded: true,
    facing: 1,
    swingT: 0,
    cooldownT: 0,
    invulUntil: 0,
    flashUntil: 0,
    hitThisSwing: false,
  };
}

export function createWorld(): World {
  return {
    player: createPlayer(),
    boss: createBoss(),
    particles: [],
    floatTexts: [],
    shake: null,
    bossHP: CFG.bossHP,
    playerHP: CFG.playerHP,
    bossDeathStartMs: null,
    playerDeathStartMs: null,
  };
}

type Box = { x1: number; x2: number; y1: number; y2: number };

function playerAttackBox(p: PlayerState): Box {
  const cx = p.x + p.facing * (CFG.playerW / 2 + CFG.playerReach / 2);
  const cy = CFG.ground + p.y - CFG.playerH / 2;
  return {
    x1: cx - CFG.playerReach / 2,
    x2: cx + CFG.playerReach / 2,
    y1: cy - CFG.playerAttackBoxH / 2,
    y2: cy + CFG.playerAttackBoxH / 2,
  };
}

function bossAttackBox(b: BossState): Box {
  const cx = b.x + b.facing * (CFG.bossW / 2 + CFG.bossReach / 2);
  const cy = CFG.ground - CFG.bossH / 2;
  return {
    x1: cx - CFG.bossReach / 2,
    x2: cx + CFG.bossReach / 2,
    y1: cy - CFG.bossAttackBoxH / 2,
    y2: cy + CFG.bossAttackBoxH / 2,
  };
}

function playerBodyBox(p: PlayerState): Box {
  const cy = CFG.ground + p.y - CFG.playerH / 2;
  return {
    x1: p.x - CFG.playerW / 2,
    x2: p.x + CFG.playerW / 2,
    y1: cy - CFG.playerH / 2,
    y2: cy + CFG.playerH / 2,
  };
}

function bossBodyBox(b: BossState): Box {
  const cy = CFG.ground - CFG.bossH / 2;
  return {
    x1: b.x - CFG.bossW / 2,
    x2: b.x + CFG.bossW / 2,
    y1: cy - CFG.bossH / 2,
    y2: cy + CFG.bossH / 2,
  };
}

function overlap(a: Box, b: Box): boolean {
  return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
}

/** 玩家發動揮劍 — 受 swing/cooldown 限制 */
export function tryPlayerSwing(world: World): boolean {
  const p = world.player;
  if (p.swingT > 0 || p.cooldownT > 0) return false;
  if (world.playerHP <= 0) return false;
  p.swingT = CFG.playerSwingDur;
  p.hitThisSwing = false;
  // 揮劍時 facing 朝向怪物(避免逆向亂砍)
  const dx = world.boss.x - p.x;
  if (Math.abs(dx) > 1) p.facing = (dx >= 0 ? 1 : -1) as Facing;
  return true;
}

/** 玩家揮劍 hitbox 是否啟動中 */
function playerSwingActive(p: PlayerState): boolean {
  if (p.swingT <= 0) return false;
  const elapsed = CFG.playerSwingDur - p.swingT;
  return elapsed >= CFG.playerHitFrom && elapsed <= CFG.playerHitTo;
}

/**
 * 一幀世界推進。alive=false(gameOver)時粒子/飛字仍會更新,但角色與輸入凍結。
 * onBossHPChange / onPlayerHPChange:HP 變化時通知 React 端同步顯示;
 * onResultChange:首次決勝時通知('win' / 'lose')。
 */
export function tickPhysics(
  world: World,
  dt: number,
  nowMs: number,
  alive: boolean,
  keys: ReadonlySet<string>,
  swingPressed: boolean,
  onBossHPChange: (hp: number) => void,
  onPlayerHPChange: (hp: number) => void,
  onResultChange: (r: 'win' | 'lose') => void,
): void {
  const { player, boss } = world;

  if (alive) {
    // --- 玩家輸入移動 ---
    let moveX = 0;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) moveX -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) moveX += 1;
    // 揮劍期間移速減半
    const speedFactor = player.swingT > 0 ? 0.45 : 1;
    // 空中也能微調(80% 控制力)
    const airFactor = player.grounded ? 1 : 0.8;

    // 移動前記住「玩家在 boss 哪一側」— 用來阻止跳躍 / 跑步穿過 boss 中心線
    const minGapBoss = (CFG.playerW + CFG.bossW) / 2 + 2;
    const sideRaw = Math.sign(player.x - boss.x);
    const prevSide: -1 | 1 = sideRaw === 0 ? (player.facing > 0 ? -1 : 1) : (sideRaw as -1 | 1);

    if (moveX !== 0) {
      player.x += moveX * CFG.playerSpeed * speedFactor * airFactor * dt;
      player.facing = (moveX > 0 ? 1 : -1) as Facing;
    } else if (player.swingT === 0 && player.grounded) {
      // 空閒時 facing 朝向怪物 — 但只在差距夠大時更新,避免抖動
      const dx = boss.x - player.x;
      if (Math.abs(dx) > 6) player.facing = (dx >= 0 ? 1 : -1) as Facing;
    }

    // 阻擋玩家穿過 boss — 但只要玩家有起跳(腳離地超過怪物腰部),就允許從上方躍過去。
    // 用「腰部」當門檻而不是「頭頂」,避免玩家明明在空中卻還被擋住。
    const canVault = !player.grounded && player.y <= -CFG.bossH * 0.5;
    if (!canVault) {
      const newSide = Math.sign(player.x - boss.x);
      if (newSide !== prevSide || Math.abs(player.x - boss.x) < minGapBoss) {
        player.x = boss.x + prevSide * minGapBoss;
      }
    }

    player.x = clamp(player.x, CFG.playerW / 2 + 6, CFG.width - CFG.playerW / 2 - 6);

    // --- 跳躍 + 重力 ---
    if (
      player.grounded &&
      (keys.has('ArrowUp') || keys.has('KeyW') || keys.has('KeyZ'))
    ) {
      player.vy = -CFG.playerJumpV;
      player.grounded = false;
    }
    if (!player.grounded) {
      player.vy += CFG.playerGravity * dt;
      player.y += player.vy * dt;
      if (player.y >= 0) {
        player.y = 0;
        player.vy = 0;
        player.grounded = true;
      }
    }

    // --- 揮劍 cooldown / 動作推進 ---
    if (player.swingT > 0) {
      player.swingT = Math.max(0, player.swingT - dt);
      if (player.swingT === 0) player.cooldownT = CFG.playerSwingCooldown;
    } else if (player.cooldownT > 0) {
      player.cooldownT = Math.max(0, player.cooldownT - dt);
    }
    // 觸發新揮劍(這裡才檢查,避免動作中被覆蓋)
    if (swingPressed && player.swingT === 0 && player.cooldownT === 0) {
      tryPlayerSwing(world);
    }

    // --- 玩家攻擊命中判定 ---
    if (
      playerSwingActive(player) &&
      !player.hitThisSwing &&
      boss.phase !== 'dead' &&
      nowMs >= boss.invulUntil
    ) {
      const ab = playerAttackBox(player);
      const bb = bossBodyBox(boss);
      if (overlap(ab, bb)) {
        player.hitThisSwing = true;
        // 玩家在 boss 面對方向 → 從正面打;否則繞背
        const sideFromBoss = Math.sign(player.x - boss.x) as -1 | 1;
        const facingPlayer = boss.facing === sideFromBoss;
        const fromBack = !facingPlayer;

        if (bossIsGuarding(boss) && facingPlayer) {
          // 被盾擋 — 0 傷害
          const sx = boss.x + boss.facing * (CFG.bossW / 2 + 6);
          const sy = CFG.ground - CFG.bossH / 2;
          spawnBlockSparks(world.particles, sx, sy);
          spawnFloatText(world.floatTexts, sx, sy - 24, 'BLOCK', '#fde68a');
          world.shake = { startMs: nowMs, durationMs: 110, intensity: 4 };
        } else {
          const dmg = fromBack ? Math.round(CFG.playerDamage * 1.5) : CFG.playerDamage;
          world.bossHP = Math.max(0, world.bossHP - dmg);
          onBossHPChange(world.bossHP);
          boss.flashUntil = nowMs + CFG.flashMs;
          boss.invulUntil = nowMs + CFG.bossInvulMs;
          const hx = boss.x;
          const hy = CFG.ground - CFG.bossH * 0.7;
          spawnHitParticles(world.particles, hx, hy, 'boss');
          spawnFloatText(
            world.floatTexts,
            hx,
            hy - 12,
            fromBack ? `致命 ${dmg}!` : `${dmg}`,
            fromBack ? '#facc15' : '#fff',
          );
          if (world.bossHP === 0) {
            bossEnterDead(boss);
            world.bossDeathStartMs = nowMs;
            spawnDeathParticles(world.particles, hx, hy, 'boss');
            world.shake = { startMs: nowMs, durationMs: 420, intensity: 12 };
            onResultChange('win');
          } else {
            bossEnterHurt(boss);
            bossKnockback(boss, player.x < boss.x);
            world.shake = { startMs: nowMs, durationMs: 200, intensity: 6 };
          }
        }
      }
    }

    // --- 怪物 AI ---
    if (boss.phase !== 'dead') advanceAi(boss, player, dt);

    // --- 怪物攻擊判定 ---
    if (
      bossSwingActive(boss) &&
      !boss.hitThisSwing &&
      world.playerHP > 0 &&
      nowMs >= player.invulUntil
    ) {
      const ab = bossAttackBox(boss);
      const pb = playerBodyBox(player);
      if (overlap(ab, pb)) {
        boss.hitThisSwing = true;
        world.playerHP = Math.max(0, world.playerHP - CFG.bossDamage);
        onPlayerHPChange(world.playerHP);
        player.flashUntil = nowMs + CFG.flashMs;
        player.invulUntil = nowMs + CFG.playerInvulMs;
        const hx = player.x;
        const hy = CFG.ground - CFG.playerH * 0.7;
        spawnHitParticles(world.particles, hx, hy, 'player');
        spawnFloatText(world.floatTexts, hx, hy - 12, `${CFG.bossDamage}`, '#fca5a5');
        if (world.playerHP === 0) {
          world.playerDeathStartMs = nowMs;
          spawnDeathParticles(world.particles, hx, hy, 'player');
          world.shake = { startMs: nowMs, durationMs: 420, intensity: 12 };
          onResultChange('lose');
        } else {
          world.shake = { startMs: nowMs, durationMs: 200, intensity: 7 };
        }
      }
    }

    // boss approach 撞到玩家:把 boss 推開,玩家位置已在前面阻擋過(由 prevSide 邏輯)
    const dx = boss.x - player.x;
    if (Math.abs(dx) < minGapBoss) {
      const sgn = dx >= 0 ? 1 : -1;
      boss.x = player.x + sgn * minGapBoss;
    }
    boss.x = clamp(boss.x, CFG.bossW / 2 + 6, CFG.width - CFG.bossW / 2 - 6);
  }

  world.particles = updateParticles(world.particles, dt);
  world.floatTexts = updateFloatTexts(world.floatTexts, dt);
}
