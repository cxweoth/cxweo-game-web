// 蜜蜂繪製 — procedural 黃黑條紋身 + 拍動翅膀。
// formation 狀態 = 站立(短翅膀拍動);diving = 翅膀張更開、稍微傾斜。

import { CFG, type Bee } from './types';

export function drawBee(ctx: CanvasRenderingContext2D, b: Bee): void {
  const cx = b.x + CFG.beeW / 2;
  const cy = b.y + CFG.beeH / 2;

  ctx.save();
  ctx.translate(cx, cy);

  // 俯衝中:朝速度方向稍微旋轉(讓蜜蜂頭朝下)
  if (b.state === 'diving' || b.state === 'returning') {
    const angle = Math.atan2(b.vy, b.vx) - Math.PI / 2;
    ctx.rotate(angle);
  }

  drawWings(ctx, b);
  drawBody(ctx);
  drawFace(ctx, b);

  ctx.restore();
}

function drawWings(ctx: CanvasRenderingContext2D, b: Bee): void {
  // 翅膀拍動:用 sin 控制 X 縮放;diving 時拍更快、更張開
  const flapSpeed = b.state === 'formation' ? 8 : 14;
  const baseSpread = b.state === 'formation' ? 0.7 : 1;
  const flap = baseSpread + Math.sin(b.wingT * flapSpeed) * 0.25;

  ctx.fillStyle = 'rgba(229, 229, 240, 0.55)';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 0.8;

  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * 9 * flap, -1, 8 * flap, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawBody(ctx: CanvasRenderingContext2D): void {
  // 黃身體
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  // 黑色橫紋(三條)
  ctx.fillStyle = '#1c1917';
  for (const dy of [-3.5, 0.5, 4]) {
    ctx.beginPath();
    ctx.ellipse(0, dy, 8.5, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 邊框
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawFace(ctx: CanvasRenderingContext2D, b: Bee): void {
  // 紅色複眼
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(-2.8, -5.2, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(2.8, -5.2, 1.6, 0, Math.PI * 2);
  ctx.fill();
  // 觸角
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-2.5, -8);
  ctx.lineTo(-4.5, -11);
  ctx.moveTo(2.5, -8);
  ctx.lineTo(4.5, -11);
  ctx.stroke();
  // 觸角末端的小圓
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(-4.5, -11, 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(4.5, -11, 0.9, 0, Math.PI * 2);
  ctx.fill();
  // 俯衝時嘴張大(更兇)
  if (b.state === 'diving') {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -2, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}
