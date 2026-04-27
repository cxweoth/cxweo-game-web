// 玩家飛機繪製 — procedural,白色三角機身 + 藍色機翼 + 火焰尾流。
// 受傷無敵時(invuln > 0)以時間切「閃爍」效果(隔幾幀消失一次)。

import { CFG, type Ship } from './types';

export function drawShip(
  ctx: CanvasRenderingContext2D,
  s: Ship,
  totalTime: number,
): void {
  // 無敵閃爍:每秒 7 次切換隱形 / 顯示
  if (s.invuln > 0 && Math.floor(s.invuln * 14) % 2 === 0) return;

  const cx = s.x;
  const cy = s.y;

  // 火焰尾流(在機身底部閃動)
  const flameLen = 8 + Math.sin(totalTime * 30) * 3;
  ctx.save();
  ctx.translate(cx, cy);
  // 外焰(橘)
  ctx.fillStyle = 'rgba(251, 146, 60, 0.85)';
  ctx.beginPath();
  ctx.moveTo(-5, CFG.shipH / 2 - 2);
  ctx.lineTo(0, CFG.shipH / 2 + flameLen);
  ctx.lineTo(5, CFG.shipH / 2 - 2);
  ctx.closePath();
  ctx.fill();
  // 內焰(黃)
  ctx.fillStyle = 'rgba(254, 240, 138, 0.95)';
  ctx.beginPath();
  ctx.moveTo(-2.5, CFG.shipH / 2 - 2);
  ctx.lineTo(0, CFG.shipH / 2 + flameLen * 0.7);
  ctx.lineTo(2.5, CFG.shipH / 2 - 2);
  ctx.closePath();
  ctx.fill();

  // 機身(銀白三角形)
  const grd = ctx.createLinearGradient(0, -CFG.shipH / 2, 0, CFG.shipH / 2);
  grd.addColorStop(0, '#f8fafc');
  grd.addColorStop(0.5, '#cbd5e1');
  grd.addColorStop(1, '#64748b');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.moveTo(0, -CFG.shipH / 2);
  ctx.lineTo(-CFG.shipW / 2 + 4, CFG.shipH / 2 - 2);
  ctx.lineTo(CFG.shipW / 2 - 4, CFG.shipH / 2 - 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 機翼(深藍寬條)
  ctx.fillStyle = '#1e3a8a';
  ctx.beginPath();
  ctx.moveTo(-CFG.shipW / 2, CFG.shipH / 2 - 6);
  ctx.lineTo(-CFG.shipW / 2 + 6, CFG.shipH / 2 - 12);
  ctx.lineTo(-3, CFG.shipH / 2 - 6);
  ctx.lineTo(-3, CFG.shipH / 2 - 2);
  ctx.lineTo(-CFG.shipW / 2 + 4, CFG.shipH / 2 - 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(CFG.shipW / 2, CFG.shipH / 2 - 6);
  ctx.lineTo(CFG.shipW / 2 - 6, CFG.shipH / 2 - 12);
  ctx.lineTo(3, CFG.shipH / 2 - 6);
  ctx.lineTo(3, CFG.shipH / 2 - 2);
  ctx.lineTo(CFG.shipW / 2 - 4, CFG.shipH / 2 - 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 駕駛艙(青色圓窗)
  ctx.fillStyle = '#22d3ee';
  ctx.beginPath();
  ctx.arc(0, -2, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0e7490';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // 駕駛艙高光
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-1, -3, 1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** 子彈(玩家綠色雷射) */
export function drawBullet(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  // 外暈
  ctx.fillStyle = 'rgba(74, 222, 128, 0.5)';
  ctx.fillRect(x - CFG.bulletW / 2 - 1, y, CFG.bulletW + 2, CFG.bulletH);
  // 主體
  ctx.fillStyle = '#bbf7d0';
  ctx.fillRect(x - CFG.bulletW / 2, y, CFG.bulletW, CFG.bulletH);
  ctx.restore();
}

/** 蜜蜂炸彈(紅色小球 + 拖尾) */
export function drawBomb(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  // 拖尾
  ctx.fillStyle = 'rgba(248, 113, 113, 0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y - 4, CFG.bombW / 2, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // 主體
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(x, y + CFG.bombH / 2, CFG.bombW * 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();
}
