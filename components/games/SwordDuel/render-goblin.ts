// 怪物哥布林戰士繪製(綠身 + 紅眼 + 鋸齒劍 + 木盾)
//
// 角色狀態:
//   guard 時盾舉到身前,劍收在背後
//   swing 時劍沿大圓弧揮過,盾收回
//   hurt 時整體紅閃 + 短暫無敵
//   dead 時旋轉倒下 + 灰化

import { CFG, type BossState } from './types';
import { RAD, roundRect } from './render-utils';

export function drawGoblin(
  ctx: CanvasRenderingContext2D,
  boss: BossState,
  nowMs: number,
): void {
  const flashing = nowMs < boss.flashUntil;
  const invul = nowMs < boss.invulUntil;
  const dead = boss.phase === 'dead';

  // 腳影
  if (!dead) {
    ctx.save();
    ctx.fillStyle = 'rgba(15,23,42,0.32)';
    ctx.beginPath();
    ctx.ellipse(boss.x, CFG.ground - 1, 26, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(boss.x, CFG.ground);
  ctx.scale(boss.facing, 1);
  if (dead) {
    const t = boss.phaseT;
    ctx.rotate(Math.min(1, t / 0.6) * Math.PI * 0.5);
    ctx.globalAlpha = Math.max(0.3, 1 - t * 0.6);
  } else if (invul && Math.floor(nowMs / 70) % 2 === 0) {
    ctx.globalAlpha = 0.6;
  }

  // 腿
  ctx.fillStyle = '#365314';
  ctx.fillRect(-12, -32, 10, 32);
  ctx.fillRect(2, -32, 10, 32);
  // 腳爪
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(-13, -4, 12, 4);
  ctx.fillRect(1, -4, 12, 4);

  // 身體
  ctx.fillStyle = '#4d7c0f';
  ctx.fillRect(-22, -68, 44, 36);
  ctx.fillStyle = '#65a30d';
  ctx.fillRect(-22, -68, 44, 5);
  // 皮帶
  ctx.fillStyle = '#3f3f46';
  ctx.fillRect(-22, -38, 44, 4);
  ctx.fillStyle = '#a16207';
  ctx.fillRect(-3, -39, 6, 6);

  // 後手劍(先畫,讓盾蓋過)
  drawGoblinSword(ctx, boss);

  // 頭
  ctx.fillStyle = '#65a30d';
  ctx.beginPath();
  ctx.arc(0, -78, 14, 0, Math.PI * 2);
  ctx.fill();
  // 尖耳
  ctx.beginPath();
  ctx.moveTo(-13, -84);
  ctx.lineTo(-22, -94);
  ctx.lineTo(-9, -82);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(13, -84);
  ctx.lineTo(22, -94);
  ctx.lineTo(9, -82);
  ctx.closePath();
  ctx.fill();
  // 眼睛
  if (!dead) {
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-7, -82, 4, 3);
    ctx.fillRect(3, -82, 4, 3);
    ctx.fillStyle = '#fef2f2';
    ctx.fillRect(-6, -81.5, 1, 1);
    ctx.fillRect(4, -81.5, 1, 1);
  } else {
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-7, -83); ctx.lineTo(-3, -79);
    ctx.moveTo(-3, -83); ctx.lineTo(-7, -79);
    ctx.moveTo(3, -83); ctx.lineTo(7, -79);
    ctx.moveTo(7, -83); ctx.lineTo(3, -79);
    ctx.stroke();
  }
  // 嘴 + 獠牙
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(-6, -74, 12, 3);
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(-5, -73, 2, 4);
  ctx.fillRect(3, -73, 2, 4);

  if (flashing) {
    ctx.fillStyle = 'rgba(220,38,38,0.55)';
    ctx.fillRect(-26, -94, 52, 90);
  }

  drawGoblinShield(ctx, boss);

  ctx.restore();
}

function drawGoblinSword(ctx: CanvasRenderingContext2D, boss: BossState): void {
  let angle = 120 * RAD;
  if (boss.phase === 'swing') {
    const e = boss.phaseT;
    const t1 = CFG.bossHitFrom;
    const t2 = CFG.bossHitTo;
    if (e < t1) {
      const k = e / t1;
      angle = (120 + k * (170 - 120)) * RAD;
    } else if (e < t2) {
      const k = (e - t1) / (t2 - t1);
      angle = (170 + k * (-50 - 170)) * RAD;
    } else {
      const k = Math.min(1, (e - t2) / (CFG.bossSwingDur - t2));
      angle = (-50 + k * (120 - -50)) * RAD;
    }
  }
  ctx.save();
  ctx.translate(-12, -60);
  ctx.rotate(angle);
  // 護手
  ctx.fillStyle = '#a16207';
  ctx.fillRect(-6, -2, 14, 4);
  // 把手
  ctx.fillStyle = '#3f3f46';
  ctx.fillRect(-2, -14, 4, 12);
  // 鋸齒劍身
  ctx.fillStyle = '#52525b';
  ctx.fillRect(-2, 2, 4, 44);
  ctx.fillStyle = '#71717a';
  ctx.fillRect(-1, 2, 1, 44);
  // 鋸齒
  ctx.fillStyle = '#52525b';
  for (let i = 0; i < 5; i++) {
    const yy = 8 + i * 8;
    ctx.beginPath();
    ctx.moveTo(2, yy);
    ctx.lineTo(7, yy + 3);
    ctx.lineTo(2, yy + 6);
    ctx.closePath();
    ctx.fill();
  }
  // 劍尖
  ctx.beginPath();
  ctx.moveTo(-2, 46);
  ctx.lineTo(2, 46);
  ctx.lineTo(0, 54);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  if (boss.phase === 'swing') {
    const e = boss.phaseT;
    if (e >= CFG.bossHitFrom && e <= CFG.bossHitTo) {
      const prog = (e - CFG.bossHitFrom) / (CFG.bossHitTo - CFG.bossHitFrom);
      ctx.save();
      ctx.translate(-12, -60);
      ctx.strokeStyle = `rgba(248,113,113,${1 - prog})`;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(0, 0, 48, 170 * RAD, (170 + prog * 220) * RAD);
      ctx.stroke();
      ctx.restore();
    }
  }
}

function drawGoblinShield(ctx: CanvasRenderingContext2D, boss: BossState): void {
  const guarding = boss.phase === 'guard';
  const t = guarding ? Math.min(1, boss.phaseT / 0.18) : 0;
  const px = 10 + t * 14;
  const py = -42 + t * -8;
  const rotIdle = -10 * RAD;
  const rotGuard = -90 * RAD;
  const rot = rotIdle + (rotGuard - rotIdle) * t;
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(rot);
  // 木盾
  ctx.fillStyle = '#92400e';
  roundRect(ctx, -16, -22, 32, 44, 6);
  ctx.fill();
  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 1;
  for (let i = -16; i < 16; i += 5) {
    ctx.beginPath();
    ctx.moveTo(i, -20);
    ctx.lineTo(i, 20);
    ctx.stroke();
  }
  ctx.strokeStyle = '#3f3f46';
  ctx.lineWidth = 2;
  roundRect(ctx, -16, -22, 32, 44, 6);
  ctx.stroke();
  ctx.fillStyle = '#a8a29e';
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fafaf9';
  ctx.beginPath();
  ctx.arc(-1.5, -1.5, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
