// 蜜蜂方陣相關邏輯:建立 / 重生 / 隊形位置 / 整體擺動 / 俯衝 / 排程下一波俯衝。
// 從 game.ts 拆出來避免單檔超過 300 行。
//
// 波次差異(wave-aware progression):
//   - 每波第 0 列會有 (wave-1) 隻紅色「隊長」(captain),分數加倍、放在隨機 col
//   - swarm speed / dive speed / bomb chance 都隨 wave 線性放大,封頂 waveScaleCap
//   - dive 間隔隨 wave 縮短,且每 waveDiveBatchPerN 波多 1 隻同時俯衝
//   - 偶數波從左邊開始擺動(視覺差異)
//
// 卡死預防:returning 狀態的蜜蜂每幀重算 vx/vy 以追蹤移動中的隊形;
//   超過 4 秒沒歸位就強制 snap 回去(避免最後一隻打不到的情況)。

import { clamp } from '@/lib/utils';
import { CFG, type Bee, type BeeType, type Bomb } from './types';

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

/** 1 + (wave-1) * scalePerWave,封頂 waveScaleCap */
function waveScale(wave: number, scalePerWave: number): number {
  return Math.min(CFG.waveScaleCap, 1 + (wave - 1) * scalePerWave);
}

export function makeBee(
  id: number,
  row: number,
  col: number,
  type: BeeType = 'regular',
): Bee {
  return {
    id,
    row,
    col,
    type,
    x: CFG.formationOriginX + col * CFG.beeCellW,
    y: CFG.formationOriginY + row * CFG.beeCellH,
    state: 'formation',
    wingT: Math.random() * 0.5,
    vx: 0,
    vy: 0,
    returnT: 0,
    alive: true,
  };
}

/** 重置成新一波;wave 越高,captains 越多、整體越靠下、初始方向交替 */
export function spawnWave(ctx: SwarmContext): void {
  ctx.bees = [];
  // 隊長數:每波多 1,封頂 = 一整列(beeCols)
  const captainCount = Math.min(Math.max(0, ctx.wave - 1), CFG.beeCols);
  const captainCols = pickRandomCols(CFG.beeCols, captainCount);
  for (let r = 0; r < CFG.beeRows; r++) {
    for (let c = 0; c < CFG.beeCols; c++) {
      const isCaptain = r === 0 && captainCols.includes(c);
      ctx.bees.push(makeBee(ctx.nextBeeId++, r, c, isCaptain ? 'captain' : 'regular'));
    }
  }
  ctx.swarmX = 0;
  // 每波整體下移一點(讓玩家空間越來越小)
  ctx.swarmY = Math.min((ctx.wave - 1) * 8, 60);
  // 偶數波從左開始擺動,視覺上每波都有差別
  ctx.swarmDir = ctx.wave % 2 === 0 ? -1 : 1;
  ctx.nextDiveSec = ctx.elapsedSec + 1.5;
}

function pickRandomCols(total: number, count: number): number[] {
  if (count <= 0) return [];
  const pool: number[] = [];
  for (let i = 0; i < total; i++) pool.push(i);
  // Fisher-Yates 洗牌
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }
  return pool.slice(0, count);
}

/** Formation 狀態下蜜蜂的世界座標 */
export function formationPos(b: Bee, ctx: SwarmContext): { x: number; y: number } {
  return {
    x: CFG.formationOriginX + b.col * CFG.beeCellW + ctx.swarmX,
    y: CFG.formationOriginY + b.row * CFG.beeCellH + ctx.swarmY,
  };
}

export function tickSwarm(ctx: SwarmContext, dt: number): void {
  const total = CFG.beeRows * CFG.beeCols;
  const killed = total - ctx.bees.length;
  // base speed * waveScale,讓擺動隨波次加快
  const wScale = waveScale(ctx.wave, CFG.waveSpeedScalePerWave);
  const speed = (CFG.swarmBaseSpeed + killed * CFG.swarmAccelPerKill) * wScale;
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

  for (const b of ctx.bees) {
    if (b.state !== 'formation') continue;
    const p = formationPos(b, ctx);
    b.x = p.x;
    b.y = p.y;
    b.wingT += dt;
  }
}

export function tickDivers(ctx: SwarmContext, dt: number): void {
  const bombMult = waveScale(ctx.wave, CFG.waveBombScalePerWave);
  for (const b of ctx.bees) {
    if (b.state === 'formation') continue;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.wingT += dt * 2;

    if (b.state === 'diving') {
      const dropChance = CFG.bombDropChancePerSec * bombMult * dt;
      if (Math.random() < dropChance) {
        const slot = ctx.bombs.find((bo) => !bo.alive);
        const bomb: Bomb = { x: b.x + CFG.beeW / 2, y: b.y + CFG.beeH, alive: true };
        if (slot) Object.assign(slot, bomb);
        else ctx.bombs.push(bomb);
      }
      // 衝出底部 → 從上方歸隊,歸隊速度減半
      if (b.y > CFG.height + 30) {
        b.state = 'returning';
        b.returnT = 0;
        b.x = clamp(b.x, 20, CFG.width - 20);
        b.y = CFG.diveRespawnY;
      }
    }

    if (b.state === 'returning') {
      b.returnT += dt;
      const target = formationPos(b, ctx);
      const dx = target.x - b.x;
      const dy = target.y - b.y;
      const len = Math.hypot(dx, dy);
      // 太久還沒歸位 → 強制 snap(避免「最後一隻抓不到」的卡關)
      if (b.returnT > 4 || len < 6) {
        b.state = 'formation';
        b.x = target.x;
        b.y = target.y;
        b.vx = 0;
        b.vy = 0;
        b.returnT = 0;
      } else {
        // 每幀重算速度 — 跟著移動的隊形(舊版只算一次,所以會飛過頭)
        const safeLen = Math.max(1, len);
        const speed = CFG.diveSpeed * 0.7;
        b.vx = (dx / safeLen) * speed;
        b.vy = (dy / safeLen) * speed;
      }
    }
  }
}

/** 隨機派蜜蜂俯衝;批次大小隨波次成長,間隔隨波次縮短 */
export function scheduleNextDive(ctx: SwarmContext): void {
  if (ctx.elapsedSec < ctx.nextDiveSec) return;

  const batchSize = 1 + Math.floor((ctx.wave - 1) / CFG.waveDiveBatchPerN);
  const candidates = ctx.bees.filter((b) => b.state === 'formation');
  const diveSpeedMult = waveScale(ctx.wave, CFG.waveDiveSpeedScalePerWave);
  const speed = CFG.diveSpeed * diveSpeedMult;

  for (let i = 0; i < batchSize && candidates.length > 0; i++) {
    const idx = Math.floor(Math.random() * candidates.length);
    const target = candidates.splice(idx, 1)[0]!;
    const dx = ctx.shipX - (target.x + CFG.beeW / 2);
    const dy = ctx.shipY - (target.y + CFG.beeH / 2);
    const len = Math.max(1, Math.hypot(dx, dy));
    target.vx = (dx / len) * speed;
    target.vy = (dy / len) * speed;
    target.state = 'diving';
  }

  // 間隔縮短 = 除以 waveScale
  const intervalScale = waveScale(ctx.wave, CFG.waveIntervalScalePerWave);
  const interval =
    (CFG.diveIntervalMin + Math.random() * (CFG.diveIntervalMax - CFG.diveIntervalMin)) /
    intervalScale;
  ctx.nextDiveSec = ctx.elapsedSec + interval;
}
