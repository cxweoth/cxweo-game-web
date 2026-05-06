// 節奏方塊 — 世界推進與碰撞
//
// 玩家固定螢幕 x,世界以 scrollSpeed 往左滾動;cameraX 表示已走過的世界距離。
// 跳躍是 vy = -jumpV(瞬間),重力把玩家拉回地面。空中時 cube 持續旋轉,
// 落地時旋轉 snap 到最近 90°,有 GD 經典的「卡卡轉」感。
//
// 碰撞規則(致敬 GD):
//   - spike 任一接觸 → 死
//   - block 從上落到頂 → 落地;從側面 / 下方撞到 → 死
// 不做 pit(暫不需要)。

import { LEVEL_END_X, endlessNextChunk } from './level';
import { spawnDeathParticles, spawnLandDust, updateParticles } from './fx';
import { CFG, type Obstacle, type Particle, type PlayerState } from './types';

export type World = {
  player: PlayerState;
  obstacles: Obstacle[];
  cameraX: number;
  /** 無盡模式已生成的最大世界 x */
  endlessMaxX: number;
  particles: Particle[];
};

export function createWorld(initialObstacles: ReadonlyArray<Obstacle>, initialMaxX: number): World {
  return {
    player: {
      x: CFG.playerX,
      y: 0,
      vy: 0,
      grounded: true,
      rotation: 0,
      deadAt: null,
    },
    obstacles: [...initialObstacles],
    cameraX: 0,
    endlessMaxX: initialMaxX,
    particles: [],
  };
}

function triggerDeath(world: World, nowMs: number): void {
  const { player } = world;
  if (player.deadAt) return;
  const px = CFG.playerX;
  const py = CFG.ground + player.y - CFG.playerSize / 2;
  player.deadAt = { x: px, y: py, ms: nowMs };
  spawnDeathParticles(world.particles, px, py);
}

export function tickPhysics(
  world: World,
  dt: number,
  nowMs: number,
  alive: boolean,
  jumpHeld: boolean,
  isEndless: boolean,
  onDeath: () => void,
  onWin: () => void,
): void {
  if (!alive) {
    world.particles = updateParticles(world.particles, dt);
    return;
  }

  const { player } = world;

  // 滾動世界
  world.cameraX += CFG.scrollSpeed * dt;

  // 無盡模式:檢查是否需要生成下一段
  if (isEndless && world.cameraX + CFG.width + 800 > world.endlessMaxX) {
    const { obstacles, nextMaxX } = endlessNextChunk(world.endlessMaxX);
    world.obstacles.push(...obstacles);
    world.endlessMaxX = nextMaxX;
  }

  // 移除已遠離螢幕後方的障礙物(節省運算)
  const cullX = world.cameraX - 200;
  world.obstacles = world.obstacles.filter((o) => {
    if (o.kind === 'block') return o.x + o.w > cullX;
    return o.x + CFG.tile > cullX;
  });

  // --- 跳躍 + 重力 ---
  // GD 風格:長按或點擊瞬間,只要 grounded 就能跳;落地立刻又跳 = 連跳
  const wasGrounded = player.grounded;
  if (jumpHeld && player.grounded) {
    player.vy = -CFG.jumpV;
    player.grounded = false;
  }
  if (!player.grounded) {
    player.vy += CFG.gravity * dt;
  }

  // --- 位置更新(用 prevY 判斷落地 vs 撞牆) ---
  const prevY = player.y;
  const prevBottomH = -prevY;
  player.y += player.vy * dt;
  const bottomH = -player.y; // 玩家腳底的「離地高度」

  // 旋轉:空中持續轉、落地時 snap
  if (!player.grounded) {
    player.rotation += dt * Math.PI * 2.6;
  }

  // --- 碰撞檢查 ---
  let surfaceH = 0;
  const playerL = CFG.playerX - CFG.playerSize / 2;
  const playerR = CFG.playerX + CFG.playerSize / 2;
  const playerTopH = bottomH + CFG.playerSize;

  for (const ob of world.obstacles) {
    if (ob.kind === 'spike') {
      const sx = ob.x - world.cameraX;
      const sx1 = sx + 5;
      const sx2 = sx + CFG.tile - 5;
      if (sx2 <= playerL || sx1 >= playerR) continue;
      // 與 spike 重疊(寬鬆判定:腳底還在 spike 高度內)
      if (bottomH < CFG.tile - 4 && playerTopH > 6) {
        triggerDeath(world, nowMs);
        onDeath();
        return;
      }
    } else if (ob.kind === 'block') {
      const sx = ob.x - world.cameraX;
      const bx1 = sx;
      const bx2 = sx + ob.w;
      if (bx2 <= playerL || bx1 >= playerR) continue;
      const topH = ob.h;
      // 從上方落下登陸 block 頂部
      if (player.vy >= 0 && prevBottomH >= topH - 2) {
        if (topH > surfaceH) surfaceH = topH;
        continue;
      }
      // 否則 AABB 垂直重疊 → 撞牆死
      if (bottomH < topH - 2 && playerTopH > 2) {
        triggerDeath(world, nowMs);
        onDeath();
        return;
      }
    }
  }

  // --- 落地 / 自由落體 ---
  if (player.y >= -surfaceH) {
    const wasInAir = !wasGrounded;
    player.y = -surfaceH;
    player.vy = 0;
    player.grounded = true;
    // snap 旋轉到最近 90°
    player.rotation = Math.round(player.rotation / (Math.PI / 2)) * (Math.PI / 2);
    if (wasInAir) {
      spawnLandDust(world.particles, CFG.playerX, CFG.ground - surfaceH);
    }
  } else {
    player.grounded = false;
  }

  // --- 勝利偵測(關卡模式) ---
  if (!isEndless && world.cameraX >= LEVEL_END_X) {
    onWin();
  }

  // --- 粒子 ---
  world.particles = updateParticles(world.particles, dt);
}
