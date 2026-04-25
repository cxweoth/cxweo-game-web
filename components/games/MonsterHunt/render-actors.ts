// 玩家、怪物、箭、火球的繪製。

import { CFG, type Arrow, type Fireball } from './types';

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  y: number,
  time: number,
  flashing: boolean,
): void {
  const x = CFG.playerX;
  const bob = Math.sin(time * 2) * 1.5;
  ctx.save();
  ctx.translate(x, y + bob);

  if (flashing) {
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
  }

  // 影子
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 30, 16, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // 軀幹（披風）
  ctx.fillStyle = flashing ? '#ef4444' : '#1d4ed8';
  ctx.beginPath();
  ctx.moveTo(-9, -10);
  ctx.lineTo(9, -10);
  ctx.lineTo(11, 22);
  ctx.lineTo(-11, 22);
  ctx.closePath();
  ctx.fill();

  // 頭
  ctx.fillStyle = '#fcd9b6';
  ctx.beginPath();
  ctx.arc(0, -18, 8, 0, Math.PI * 2);
  ctx.fill();

  // 兜帽
  ctx.fillStyle = flashing ? '#ef4444' : '#1e3a8a';
  ctx.beginPath();
  ctx.arc(0, -18, 9, Math.PI, 0, false);
  ctx.lineTo(8, -10);
  ctx.lineTo(-8, -10);
  ctx.closePath();
  ctx.fill();

  // 弓
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(14, 0, 18, -Math.PI / 2 - 0.5, Math.PI / 2 + 0.5);
  ctx.stroke();
  // 弓弦
  ctx.strokeStyle = '#1c1917';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(14, -16);
  ctx.lineTo(14, 16);
  ctx.stroke();

  ctx.restore();
}

export function drawMonster(
  ctx: CanvasRenderingContext2D,
  y: number,
  time: number,
  flashing: boolean,
  hp: number,
): void {
  const x = CFG.monsterX;
  const breath = Math.sin(time * 3) * 2;
  const r = CFG.monsterR + breath * 0.3;
  ctx.save();
  ctx.translate(x, y);

  if (flashing) {
    ctx.shadowColor = '#fef08a';
    ctx.shadowBlur = 18;
  }

  // 影子
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(0, r + 4, r * 0.9, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 主體
  const grd = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r);
  if (flashing) {
    grd.addColorStop(0, '#fde68a');
    grd.addColorStop(1, '#dc2626');
  } else {
    grd.addColorStop(0, '#86efac');
    grd.addColorStop(1, '#15803d');
  }
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // 觸角
  ctx.strokeStyle = flashing ? '#dc2626' : '#15803d';
  ctx.lineWidth = 2;
  for (const sx of [-10, 10]) {
    ctx.beginPath();
    ctx.moveTo(sx, -r + 6);
    ctx.quadraticCurveTo(
      sx + Math.sin(time * 4 + sx) * 4,
      -r - 6,
      sx + Math.sin(time * 4 + sx) * 6,
      -r - 14,
    );
    ctx.stroke();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(sx + Math.sin(time * 4 + sx) * 6, -r - 14, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 眼睛
  for (const sx of [-8, 8]) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(sx, -4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(sx + 1, -3, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 嘴
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (flashing) {
    ctx.moveTo(-6, 12);
    ctx.lineTo(6, 18);
    ctx.moveTo(6, 12);
    ctx.lineTo(-6, 18);
  } else {
    ctx.moveTo(-8, 12);
    ctx.quadraticCurveTo(0, 22, 8, 12);
  }
  ctx.stroke();

  // 頭頂血條
  const barW = 50;
  const barH = 5;
  const ratio = hp / CFG.monsterHP;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(-barW / 2, -r - 26, barW, barH);
  ctx.fillStyle = ratio > 0.5 ? '#22c55e' : ratio > 0.2 ? '#facc15' : '#ef4444';
  ctx.fillRect(-barW / 2, -r - 26, barW * ratio, barH);

  ctx.restore();
}

export function drawArrow(ctx: CanvasRenderingContext2D, a: Arrow): void {
  ctx.save();
  ctx.translate(a.x, a.y);
  // 箭桿
  ctx.strokeStyle = '#fde68a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.lineTo(0, 0);
  ctx.stroke();
  // 箭頭
  ctx.fillStyle = '#fcd34d';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-7, -3);
  ctx.lineTo(-7, 3);
  ctx.closePath();
  ctx.fill();
  // 羽毛
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.lineTo(-28, -3.5);
  ctx.lineTo(-22, 0);
  ctx.lineTo(-28, 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawFireball(ctx: CanvasRenderingContext2D, f: Fireball): void {
  const r = CFG.fireballR + Math.sin(f.phase * 16) * 1.5;
  ctx.save();
  // 外焰
  const grd = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r * 2.4);
  grd.addColorStop(0, 'rgba(254,243,199,0.95)');
  grd.addColorStop(0.4, 'rgba(251,146,60,0.8)');
  grd.addColorStop(1, 'rgba(220,38,38,0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(f.x, f.y, r * 2.4, 0, Math.PI * 2);
  ctx.fill();
  // 核
  ctx.fillStyle = '#fef9c3';
  ctx.beginPath();
  ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
