// 跳躍王 — Canvas 繪圖

import { CFG } from './types';
import type { World } from './game';

export function drawScene(ctx: CanvasRenderingContext2D, world: World): void {
  drawBackground(ctx);
  drawPlatforms(ctx, world);
  drawPlayer(ctx, world);
  drawParticles(ctx, world);

  if (!world.alive) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, CFG.width, CFG.height);
  }
}

function drawBackground(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, 0, 0, CFG.height);
  g.addColorStop(0, '#fef3c7');
  g.addColorStop(1, '#fde68a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CFG.width, CFG.height);

  // 點點紙效
  ctx.fillStyle = 'rgba(120,53,15,0.08)';
  for (let y = 8; y < CFG.height; y += 24) {
    for (let x = 8; x < CFG.width; x += 24) {
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPlatforms(ctx: CanvasRenderingContext2D, world: World): void {
  for (const p of world.platforms) {
    if (p.broken) continue;
    const sy = p.y - world.cameraY;
    if (sy < -20 || sy > CFG.height + 20) continue;
    drawPlatform(ctx, p.x, sy, p.w, p.kind, p.spring ?? 0);
  }
}

function drawPlatform(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  kind: World['platforms'][number]['kind'],
  spring: number,
): void {
  const h = CFG.platH;
  let main = '#22c55e';
  let dark = '#15803d';
  if (kind === 'moving') {
    main = '#3b82f6';
    dark = '#1e40af';
  } else if (kind === 'breakable') {
    main = '#a16207';
    dark = '#78350f';
  } else if (kind === 'spring') {
    main = '#facc15';
    dark = '#854d0e';
  }

  // 主體 + 陰影邊
  ctx.fillStyle = dark;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.fillStyle = main;
  roundRect(ctx, x, y, w, h - 4, 6);
  ctx.fill();

  if (kind === 'spring') {
    // 中央彈簧 icon:四橫線疊加,squash 動畫
    const cx = x + w / 2;
    const sy = y - 8 + spring * 4;
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - 8, sy + i * 3);
      ctx.lineTo(cx + 8, sy + i * 3);
      ctx.stroke();
    }
  }
  if (kind === 'breakable') {
    // 裂痕
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.35, y + 2);
    ctx.lineTo(x + w * 0.4, y + h - 4);
    ctx.moveTo(x + w * 0.65, y + 2);
    ctx.lineTo(x + w * 0.6, y + h - 4);
    ctx.stroke();
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPlayer(ctx: CanvasRenderingContext2D, world: World): void {
  const sy = world.py - world.cameraY;
  const sx = world.px;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(world.facing, 1);

  // 身體:圓綠生物
  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.ellipse(0, 0, CFG.playerW / 2, CFG.playerH / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#14532d';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 眼睛
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(5, -5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(7, -5, 2.4, 0, Math.PI * 2);
  ctx.fill();

  // 嘴
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(2, 4, 4, 0.1, Math.PI - 0.1);
  ctx.stroke();

  // 腳 / 鰭(隨 vy 微擺)
  const flap = Math.sin(performance.now() / 80) * 2;
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.ellipse(-10, CFG.playerH / 2 - 4, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(10, CFG.playerH / 2 - 4 + flap, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, world: World): void {
  for (const p of world.particles) {
    const k = 1 - p.age / p.ttl;
    ctx.globalAlpha = Math.max(0, k);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y - world.cameraY, 2 + k * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
