// 蜜蜂方陣相關邏輯:建立 / 重生 / 隊形位置 / 整體擺動 / 俯衝 / 排程下一波俯衝。
// 從 game.ts 拆出來避免單檔超過 300 行。

import { clamp } from '@/lib/utils';
import { CFG, type Bee, type Bomb, type SoundKind } from './types';

export type SwarmContext = {
  bees: Bee[];
  bombs: Bomb[];
  swarmX: number;
  swarmY: number;
  swarmDir: 1 | -1;
  elapsedSec: number;
  nextDiveSec: number;
  wave: number;
  nextBeeId: number;
  shipX: number;
  shipY: number;
};

export function makeBee(id: number, row: number, col: number): Bee {
  return {
    id,
    row,
    col,
    x: CFG.formationOriginX + col * CFG.beeCellW,
    y: CFG.formationOriginY + row * CFG.beeCellH,
    state: 'formation',
    wingT: Math.random() * 0.5,
    vx: 0,
    vy: 0,
    alive: true,
  };
}

/** 重置成新一波(整盤 5×6) */
export function spawnWave(ctx: SwarmContext): void {
  ctx.bees = [];
  for (let r = 0; r < CFG.beeRows; r++) {
    for (let c = 0; c < CFG.beeCols; c++) {
      ctx.bees.push(makeBee(ctx.nextBeeId++, r, c));
    }
  }
  ctx.swarmX = 0;
  ctx.swarmY = 0;
  ctx.swarmDir = 1;
  ctx.nextDiveSec = ctx.elapsedSec + 1.5;
}

/** Formation 狀態下蜜蜂的世界座標 */
export function formationPos(b: Bee, ctx: SwarmContext): { x: number; y: number } {
  return {
    x: CFG.formationOriginX + b.col * CFG.beeCellW + ctx.swarmX,
    y: CFG.formationOriginY + b.row * CFG.beeCellH + ctx.swarmY,
  };
}

/** 整體左右擺動 + 碰邊反向下沉 */
export function tickSwarm(ctx: SwarmContext, dt: number): void {
  const total = CFG.beeRows * CFG.beeCols;
  const killed = total - ctx.bees.length;
  const speed = CFG.swarmBaseSpeed + killed * CFG.swarmAccelPerKill;
  ctx.swarmX += ctx.swarmDir * speed * dt;

  let minX = Infinity;
  let maxX = -Infinity;
  for (const b of ctx.bees) {
    if (b.state !== 'formation') continue;
    const p = formationPos(b, ctx);
    if (p.x < minX) minX = p.x;
    if (p.x + CFG.beeW > maxX) maxX = p.x + CFG.beeW;
  }
  if (minX === Infinity) return;

  if (minX < 8 && ctx.swarmDir < 0) {
    ctx.swarmDir = 1;
    ctx.swarmY += CFG.swarmDropPerWall;
  } else if (maxX > CFG.width - 8 && ctx.swarmDir > 0) {
    ctx.swarmDir = -1;
    ctx.swarmY += CFG.swarmDropPerWall;
  }

  // 同步 formation 蜜蜂的世界座標 + 翅膀拍動
  for (const b of ctx.bees) {
    if (b.state !== 'formation') continue;
    const p = formationPos(b, ctx);
    b.x = p.x;
    b.y = p.y;
    b.wingT += dt;
  }
}

/** 俯衝中的蜜蜂直線飛 + 偶爾投彈;衝出底部從上方歸隊 */
export function tickDivers(ctx: SwarmContext, dt: number): void {
  for (const b of ctx.bees) {
    if (b.state === 'formation') continue;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.wingT += dt * 2;

    if (b.state === 'diving') {
      const dropChance = CFG.bombDropChancePerSec * dt;
      if (Math.random() < dropChance) {
        const slot = ctx.bombs.find((bo) => !bo.alive);
        const bomb: Bomb = { x: b.x + CFG.beeW / 2, y: b.y + CFG.beeH, alive: true };
        if (slot) Object.assign(slot, bomb);
        else ctx.bombs.push(bomb);
      }
    }

    // 衝出底部 → 從上方回來,歸隊速度減半
    if (b.y > CFG.height + 30 && b.state === 'diving') {
      b.state = 'returning';
      b.x = clamp(b.x, 20, CFG.width - 20);
      b.y = CFG.diveRespawnY;
      const target = formationPos(b, ctx);
      const dx = target.x - b.x;
      const dy = target.y - b.y;
      const len = Math.max(1, Math.hypot(dx, dy));
      b.vx = (dx / len) * CFG.diveSpeed * 0.7;
      b.vy = (dy / len) * CFG.diveSpeed * 0.7;
    }

    // 接近原本位置 → 歸隊
    if (b.state === 'returning') {
      const target = formationPos(b, ctx);
      if (Math.hypot(target.x - b.x, target.y - b.y) < 6) {
        b.state = 'formation';
        b.x = target.x;
        b.y = target.y;
        b.vx = 0;
        b.vy = 0;
      }
    }
  }
}

/** 隨機派一隻蜜蜂俯衝;朝玩家當前位置直線 */
export function scheduleNextDive(ctx: SwarmContext): void {
  if (ctx.elapsedSec < ctx.nextDiveSec) return;
  const candidates = ctx.bees.filter((b) => b.state === 'formation');
  if (candidates.length > 0) {
    const target = candidates[Math.floor(Math.random() * candidates.length)]!;
    const dx = ctx.shipX - (target.x + CFG.beeW / 2);
    const dy = ctx.shipY - (target.y + CFG.beeH / 2);
    const len = Math.max(1, Math.hypot(dx, dy));
    target.vx = (dx / len) * CFG.diveSpeed;
    target.vy = (dy / len) * CFG.diveSpeed;
    target.state = 'diving';
  }
  // 波次越高間隔越短
  const speedup = Math.max(0.4, 1 - (ctx.wave - 1) * 0.1);
  const interval =
    (CFG.diveIntervalMin + Math.random() * (CFG.diveIntervalMax - CFG.diveIntervalMin)) *
    speedup;
  ctx.nextDiveSec = ctx.elapsedSec + interval;
}

/** 抑制 unused 警告(之後若想加俯衝開始音效) */
export function _unused(_kind: SoundKind): void {}
