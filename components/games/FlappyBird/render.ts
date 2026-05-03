// 跳跳鳥 — Canvas 渲染
//
// 純函式、不持有狀態。每幀把 world 重畫到 ctx 上。
// 所有顏色都寫死,免得 dark mode 下 canvas 內顏色亂跳。

import { CFG } from './types';
import type { World } from './game';

export function drawScene(ctx: CanvasRenderingContext2D, world: World): void {
  // 抖動位移(死亡瞬間)
  let shakeX = 0;
  let shakeY = 0;
  if (world.fx.shakeT > 0) {
    const k = world.fx.shakeT * 8;
    shakeX = (Math.random() - 0.5) * 14 * k;
    shakeY = (Math.random() - 0.5) * 14 * k;
  }
  ctx.save();
  ctx.translate(shakeX, shakeY);

  drawSky(ctx);
  drawClouds(ctx, world);
  drawPipes(ctx, world);
  drawGround(ctx, world);
  drawBird(ctx, world);
  drawParticles(ctx, world);

  ctx.restore();

  // 死亡白光不參與抖動
  if (world.fx.flashT > 0) {
    ctx.fillStyle = `rgba(255,255,255,${world.fx.flashT * 2})`;
    ctx.fillRect(0, 0, CFG.width, CFG.height);
  }

  // 大字分數(playing / dying / dead 都顯示)
  if (world.status !== 'idle') {
    ctx.save();
    ctx.font = 'bold 72px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.fillStyle = '#fff';
    const text = String(world.score);
    ctx.strokeText(text, CFG.width / 2, 90);
    ctx.fillText(text, CFG.width / 2, 90);
    ctx.restore();
  }

  // idle 提示
  if (world.status === 'idle') {
    ctx.save();
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.fillStyle = '#fff';
    const lines = ['點擊 / 空白鍵起飛', '撐越久越強'];
    lines.forEach((l, i) => {
      const y = 410 + i * 32;
      ctx.strokeText(l, CFG.width / 2, y);
      ctx.fillText(l, CFG.width / 2, y);
    });
    ctx.restore();
  }
}

function drawSky(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, 0, 0, CFG.height - CFG.groundH);
  g.addColorStop(0, '#7dd3fc');
  g.addColorStop(1, '#38bdf8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CFG.width, CFG.height - CFG.groundH);
}

function drawClouds(ctx: CanvasRenderingContext2D, world: World): void {
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (const c of world.clouds) {
    const r = 22 * c.scale;
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.arc(c.x + r * 0.9, c.y + r * 0.2, r * 0.85, 0, Math.PI * 2);
    ctx.arc(c.x - r * 0.9, c.y + r * 0.2, r * 0.8, 0, Math.PI * 2);
    ctx.arc(c.x + r * 0.3, c.y - r * 0.5, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPipes(ctx: CanvasRenderingContext2D, world: World): void {
  const groundY = CFG.height - CFG.groundH;
  for (const p of world.pipes) {
    const left = p.x - CFG.pipeW / 2;
    const top = p.gapY - CFG.pipeGap / 2;
    const bottom = p.gapY + CFG.pipeGap / 2;
    drawOnePipe(ctx, left, 0, CFG.pipeW, top, true);
    drawOnePipe(ctx, left, bottom, CFG.pipeW, groundY - bottom, false);
  }
}

function drawOnePipe(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  flip: boolean,
): void {
  // 主體:綠色漸層 + 邊框
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, '#16a34a');
  g.addColorStop(0.5, '#4ade80');
  g.addColorStop(1, '#15803d');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#14532d';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  // 管口:稍微突出 4px
  const lipH = 28;
  const lipX = x - 4;
  const lipW = w + 8;
  const lipY = flip ? y + h - lipH : y;
  const lg = ctx.createLinearGradient(lipX, 0, lipX + lipW, 0);
  lg.addColorStop(0, '#15803d');
  lg.addColorStop(0.5, '#22c55e');
  lg.addColorStop(1, '#166534');
  ctx.fillStyle = lg;
  ctx.fillRect(lipX, lipY, lipW, lipH);
  ctx.strokeRect(lipX + 0.5, lipY + 0.5, lipW - 1, lipH - 1);
}

function drawGround(ctx: CanvasRenderingContext2D, world: World): void {
  const y = CFG.height - CFG.groundH;
  // 底色
  ctx.fillStyle = '#a16207';
  ctx.fillRect(0, y, CFG.width, CFG.groundH);
  // 上緣草地
  ctx.fillStyle = '#65a30d';
  ctx.fillRect(0, y, CFG.width, 14);
  ctx.fillStyle = '#3f6212';
  ctx.fillRect(0, y + 14, CFG.width, 4);

  // 條紋:每 32px 一條,跟著 groundOffset 平移
  ctx.strokeStyle = 'rgba(120,53,15,0.35)';
  ctx.lineWidth = 2;
  const off = world.groundOffset;
  for (let gx = off; gx < CFG.width; gx += 32) {
    ctx.beginPath();
    ctx.moveTo(gx, y + 22);
    ctx.lineTo(gx + 16, y + CFG.groundH - 6);
    ctx.stroke();
  }
}

function drawBird(ctx: CanvasRenderingContext2D, world: World): void {
  ctx.save();
  ctx.translate(CFG.birdX, world.birdY);
  ctx.rotate(world.birdAngle);

  // 翅膀拍動相位:用 vy 決定姿勢(往上飛打開、往下垂)
  const wingPhase = Math.max(-1, Math.min(1, -world.birdVy / 400));

  // 身體
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#854d0e';
  ctx.stroke();

  // 翅膀
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.ellipse(-3, 2, 11, 6 + wingPhase * 2, wingPhase * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 嘴
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(16, -3);
  ctx.lineTo(30, 0);
  ctx.lineTo(16, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 眼白
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(10, -6, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // 黑瞳
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(11, -6, 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, world: World): void {
  for (const p of world.particles) {
    const k = 1 - p.age / p.ttl;
    ctx.globalAlpha = Math.max(0, k);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3 + 3 * k, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
