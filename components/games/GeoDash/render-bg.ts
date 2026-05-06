// 霓虹漸層背景 + 太陽 + 遠山剪影 + 地面下方滾動網格

import { CFG } from './types';

export function drawBackground(ctx: CanvasRenderingContext2D, cameraX: number): void {
  // 漸層天空(深紫 → 粉紫 → 橘紅 → 暗紅)
  const sky = ctx.createLinearGradient(0, 0, 0, CFG.height);
  sky.addColorStop(0, '#1e1b4b');
  sky.addColorStop(0.3, '#581c87');
  sky.addColorStop(0.55, '#be185d');
  sky.addColorStop(0.78, '#f97316');
  sky.addColorStop(1, '#451a03');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CFG.width, CFG.height);

  // 大太陽 / 月亮
  const sx = 540;
  const sy = 200;
  const sun = ctx.createRadialGradient(sx, sy, 10, sx, sy, 110);
  sun.addColorStop(0, '#fef3c7');
  sun.addColorStop(0.4, '#fbbf24');
  sun.addColorStop(0.8, '#dc2626');
  sun.addColorStop(1, 'rgba(220,38,38,0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sx, sy, 110, 0, Math.PI * 2);
  ctx.fill();

  // 遠山剪影
  ctx.fillStyle = '#1e1b4b';
  drawMountains(ctx, [
    [-40, 360],
    [60, 320],
    [180, 340],
    [300, 300],
    [430, 330],
    [560, 310],
    [680, 340],
    [840, 360],
  ]);

  // 地平線螢光線
  ctx.strokeStyle = '#f0abfc';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, CFG.ground);
  ctx.lineTo(CFG.width, CFG.ground);
  ctx.stroke();

  // 地面下方:滾動格線(垂直 + 水平形成網格)
  drawGroundGrid(ctx, cameraX);
}

function drawMountains(
  ctx: CanvasRenderingContext2D,
  peaks: Array<[number, number]>,
): void {
  ctx.beginPath();
  ctx.moveTo(0, CFG.ground);
  for (const [x, y] of peaks) ctx.lineTo(x, y);
  ctx.lineTo(CFG.width, CFG.ground);
  ctx.closePath();
  ctx.fill();
}

function drawGroundGrid(ctx: CanvasRenderingContext2D, cameraX: number): void {
  // 地面下底色
  ctx.fillStyle = '#0f0a2c';
  ctx.fillRect(0, CFG.ground, CFG.width, CFG.height - CFG.ground);

  ctx.strokeStyle = 'rgba(244,114,182,0.45)';
  ctx.lineWidth = 1;

  // 水平線
  const horizYs = [CFG.ground + 14, CFG.ground + 32, CFG.ground + 54, CFG.ground + 78];
  for (const y of horizYs) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CFG.width, y);
    ctx.stroke();
  }

  // 垂直線(隨 cameraX 滾動)
  const spacing = 30;
  const offset = -((cameraX % spacing) + spacing) % spacing;
  for (let x = offset; x <= CFG.width + spacing; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, CFG.ground);
    ctx.lineTo(x, CFG.height);
    ctx.stroke();
  }
}
