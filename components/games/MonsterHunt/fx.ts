// 死亡特效繪圖：爆炸、粒子、屍體、浮字。
// 純函式，由 render.ts / Canvas 在每幀呼叫。

import { CFG, type DeathFx, type Particle, type Shake } from './types';

/** 在 (x, y) 噴出 N 顆粒子；color 列表會隨機挑 */
export function spawnParticles(
  pool: Particle[],
  x: number,
  y: number,
  side: 'monster' | 'player',
): void {
  const colors =
    side === 'monster'
      ? ['#fbbf24', '#fb923c', '#ef4444', '#fde68a', '#65a30d']
      : ['#ef4444', '#fca5a5', '#fbbf24', '#fde68a'];
  const count = 26;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const speed = 220 + Math.random() * 360;
    pool.push({
      x,
      y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 120, // 偏上方,看起來像被打飛
      age: 0,
      ttl: 0.7 + Math.random() * 0.7,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      r: 2 + Math.random() * 3,
    });
  }
}

/** 每幀更新粒子位置 + 重力,過期自動清掉 */
export function updateParticles(pool: Particle[], dt: number): Particle[] {
  const live: Particle[] = [];
  for (const p of pool) {
    p.age += dt;
    if (p.age >= p.ttl) continue;
    p.vy += 700 * dt; // 重力
    p.vx *= 0.99; // 空氣阻力(輕微)
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    // 落地後黏在地上
    if (p.y > CFG.ground - 2) {
      p.y = CFG.ground - 2;
      p.vy = 0;
      p.vx *= 0.6;
    }
    live.push(p);
  }
  return live;
}

/** 計算當下震動偏移;沒在震動回 (0, 0) */
export function computeShake(shake: Shake | null, nowMs: number): { x: number; y: number } {
  if (!shake) return { x: 0, y: 0 };
  const elapsed = nowMs - shake.startMs;
  if (elapsed >= shake.durationMs) return { x: 0, y: 0 };
  // 強度隨時間衰減
  const fraction = 1 - elapsed / shake.durationMs;
  const amp = shake.intensity * fraction;
  return {
    x: (Math.random() - 0.5) * amp * 2,
    y: (Math.random() - 0.5) * amp * 2,
  };
}

// --- 繪圖 ---

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: ReadonlyArray<Particle>,
): void {
  for (const p of particles) {
    const alpha = Math.max(0, 1 - p.age / p.ttl);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** 死亡瞬間的能量爆裂(0~0.45s) */
export function drawDeathBurst(
  ctx: CanvasRenderingContext2D,
  fx: DeathFx,
  nowMs: number,
): void {
  const elapsed = (nowMs - fx.startMs) / 1000;
  if (elapsed > 0.45) return;
  const r = elapsed * 280;
  const alpha = Math.max(0, 1 - elapsed / 0.45);
  ctx.save();
  const grd = ctx.createRadialGradient(fx.x, fx.y, 0, fx.x, fx.y, r);
  if (fx.side === 'monster') {
    grd.addColorStop(0, `rgba(255,255,255,${alpha})`);
    grd.addColorStop(0.3, `rgba(254,243,199,${alpha * 0.9})`);
    grd.addColorStop(0.7, `rgba(251,146,60,${alpha * 0.5})`);
    grd.addColorStop(1, 'rgba(220,38,38,0)');
  } else {
    grd.addColorStop(0, `rgba(255,255,255,${alpha})`);
    grd.addColorStop(0.5, `rgba(254,202,202,${alpha * 0.7})`);
    grd.addColorStop(1, 'rgba(127,29,29,0)');
  }
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(fx.x, fx.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** 怪物的「死體」:灰化、旋轉下沉、淡出(1.5s) */
export function drawDeadMonster(
  ctx: CanvasRenderingContext2D,
  fx: DeathFx,
  nowMs: number,
): void {
  const elapsed = (nowMs - fx.startMs) / 1000;
  if (elapsed > 1.6) return;
  const fall = Math.min(40, elapsed * 50);
  const rotation = elapsed * 0.7;
  const alpha = elapsed < 0.3 ? 1 : Math.max(0, 1 - (elapsed - 0.3) / 1.3);

  ctx.save();
  ctx.translate(fx.x, fx.y + fall);
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;

  // 灰化身體
  ctx.fillStyle = '#52525b';
  ctx.beginPath();
  ctx.arc(0, 0, CFG.monsterR, 0, Math.PI * 2);
  ctx.fill();

  // X 眼
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const sx of [-8, 8]) {
    ctx.beginPath();
    ctx.moveTo(sx - 4, -8);
    ctx.lineTo(sx + 4, 0);
    ctx.moveTo(sx + 4, -8);
    ctx.lineTo(sx - 4, 0);
    ctx.stroke();
  }

  // 倒掛笑臉變成嘴 X
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6, 14);
  ctx.lineTo(6, 20);
  ctx.moveTo(6, 14);
  ctx.lineTo(-6, 20);
  ctx.stroke();

  ctx.restore();
}

/** 玩家死亡:角色倒地、淡出 */
export function drawDeadPlayer(
  ctx: CanvasRenderingContext2D,
  fx: DeathFx,
  nowMs: number,
): void {
  const elapsed = (nowMs - fx.startMs) / 1000;
  if (elapsed > 1.6) return;
  const tilt = Math.min(Math.PI / 2, elapsed * 2.4);
  const alpha = elapsed < 0.4 ? 1 : Math.max(0, 1 - (elapsed - 0.4) / 1.2);

  ctx.save();
  ctx.translate(fx.x, fx.y + Math.min(20, elapsed * 30));
  ctx.rotate(tilt);
  ctx.globalAlpha = alpha;

  // 軀幹
  ctx.fillStyle = '#7f1d1d';
  ctx.beginPath();
  ctx.moveTo(-9, -10);
  ctx.lineTo(9, -10);
  ctx.lineTo(11, 22);
  ctx.lineTo(-11, 22);
  ctx.closePath();
  ctx.fill();
  // 頭
  ctx.fillStyle = '#a8a29e';
  ctx.beginPath();
  ctx.arc(0, -18, 8, 0, Math.PI * 2);
  ctx.fill();
  // X 眼
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-5, -22);
  ctx.lineTo(-1, -16);
  ctx.moveTo(-1, -22);
  ctx.lineTo(-5, -16);
  ctx.moveTo(1, -22);
  ctx.lineTo(5, -16);
  ctx.moveTo(5, -22);
  ctx.lineTo(1, -16);
  ctx.stroke();

  ctx.restore();
}

/** 浮起並淡出的勝利 / 失敗文字 */
export function drawDeathText(
  ctx: CanvasRenderingContext2D,
  fx: DeathFx,
  nowMs: number,
): void {
  const elapsed = (nowMs - fx.startMs) / 1000;
  if (elapsed < 0.15 || elapsed > 1.5) return;
  const t = (elapsed - 0.15) / 1.35;
  const yOffset = -30 - t * 60;
  const alpha = t < 0.65 ? 1 : Math.max(0, 1 - (t - 0.65) / 0.35);
  const scale = Math.min(1, t * 4); // 開頭瞬間放大進場

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(fx.x, fx.y + yOffset);
  ctx.scale(scale, scale);
  ctx.font = 'bold 32px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const text = fx.side === 'monster' ? '擊 敗 !' : 'K . O .';
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#000';
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = fx.side === 'monster' ? '#fde047' : '#fca5a5';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}
