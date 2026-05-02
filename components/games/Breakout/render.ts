// Canvas 繪圖層:純函式,讀 World 畫圖。

import { CFG } from './types';
import type { World } from './physics';

export function drawScene(
  ctx: CanvasRenderingContext2D,
  world: World,
  nowMs: number,
): void {
  ctx.save();
  if (nowMs < world.shakeUntil) {
    const remain = (world.shakeUntil - nowMs) / 250;
    const mag = remain * 5;
    ctx.translate(
      (Math.random() - 0.5) * 2 * mag,
      (Math.random() - 0.5) * 2 * mag,
    );
  }
  drawBackground(ctx);
  drawBricks(ctx, world);
  drawPaddle(ctx, world);
  drawBall(ctx, world, nowMs);
  drawParticles(ctx, world);
  drawStickyHint(ctx, world);
  ctx.restore();
}

function drawBackground(ctx: CanvasRenderingContext2D): void {
  // 漸層深藍底
  const grad = ctx.createLinearGradient(0, 0, 0, CFG.height);
  grad.addColorStop(0, '#0c1226');
  grad.addColorStop(1, '#1e293b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CFG.width, CFG.height);

  // 微星空(固定種子,不每幀隨機)
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  for (let i = 0; i < 40; i++) {
    const x = (i * 73 + 17) % CFG.width;
    const y = ((i * 41 + 9) % (CFG.height - 80)) + 5;
    ctx.fillRect(x, y, 1.2, 1.2);
  }

  // 邊框微光
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, CFG.width - 2, CFG.height - 2);
}

function drawBricks(ctx: CanvasRenderingContext2D, world: World): void {
  for (const b of world.bricks) {
    if (!b.alive) continue;
    // 主體
    ctx.fillStyle = b.color;
    roundRect(ctx, b.x, b.y, b.w, b.h, 3);
    ctx.fill();
    // 上緣高光
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, 3);
    // 下緣陰影
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(b.x + 2, b.y + b.h - 4, b.w - 4, 2);
  }
}

function drawPaddle(ctx: CanvasRenderingContext2D, world: World): void {
  const x = world.paddleX - world.paddleW / 2;
  const y = CFG.paddleY - CFG.paddleH / 2;
  // 板子主體:藍綠漸層
  const grad = ctx.createLinearGradient(0, y, 0, y + CFG.paddleH);
  grad.addColorStop(0, '#67e8f9');
  grad.addColorStop(1, '#22d3ee');
  ctx.fillStyle = grad;
  roundRect(ctx, x, y, world.paddleW, CFG.paddleH, 6);
  ctx.fill();
  // 高光
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(x + 4, y + 2, world.paddleW - 8, 2);
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  world: World,
  nowMs: number,
): void {
  const b = world.ball;
  // 球本體
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fill();
  // 高光
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.32, 0, Math.PI * 2);
  ctx.fill();
  // sticky 時球的提示光環(呼吸)
  if (world.ballState === 'sticky') {
    const breath = 0.5 + Math.sin(nowMs / 200) * 0.3;
    ctx.strokeStyle = `rgba(254, 243, 199, ${breath.toFixed(3)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r + 4, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, world: World): void {
  for (const p of world.particles) {
    const a = 1 - p.life / p.ttl;
    if (a <= 0) continue;
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function drawStickyHint(ctx: CanvasRenderingContext2D, world: World): void {
  if (world.ballState !== 'sticky') return;
  if (world.bricksAlive === 0) return;
  const remain = Math.max(
    0,
    1 - (performance.now() - world.stickySince) / 800,
  );
  ctx.fillStyle = `rgba(255,255,255,${(0.7 - remain * 0.4).toFixed(3)})`;
  ctx.font = 'bold 14px ui-sans-serif, system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('準備…', world.paddleX, CFG.paddleY - 30);
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
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
