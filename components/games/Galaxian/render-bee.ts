// 蜜蜂繪製 — procedural 黃黑條紋身 + 拍動翅膀;
// 隊長(captain)用紅色身體 + 金色小皇冠,提示玩家「打到加分」。

import { CFG, type Bee } from './types';

type BeePalette = {
  body: string;
  stripe: string;
  outline: string;
  wing: string;
  wingStroke: string;
  eye: string;
  antenna: string;
};

const REGULAR: BeePalette = {
  body: '#facc15',
  stripe: '#1c1917',
  outline: '#0f172a',
  wing: 'rgba(229, 229, 240, 0.55)',
  wingStroke: 'rgba(0, 0, 0, 0.35)',
  eye: '#dc2626',
  antenna: '#0f172a',
};

const CAPTAIN: BeePalette = {
  body: '#f87171',
  stripe: '#7f1d1d',
  outline: '#450a0a',
  wing: 'rgba(255, 220, 220, 0.6)',
  wingStroke: 'rgba(80, 0, 0, 0.45)',
  eye: '#fef3c7',
  antenna: '#450a0a',
};

export function drawBee(ctx: CanvasRenderingContext2D, b: Bee): void {
  const cx = b.x + CFG.beeW / 2;
  const cy = b.y + CFG.beeH / 2;
  const palette = b.type === 'captain' ? CAPTAIN : REGULAR;

  ctx.save();
  ctx.translate(cx, cy);
  if (b.state === 'diving' || b.state === 'returning') {
    const angle = Math.atan2(b.vy, b.vx) - Math.PI / 2;
    ctx.rotate(angle);
  }
  drawWings(ctx, b, palette);
  drawBody(ctx, palette);
  drawFace(ctx, b, palette);
  if (b.type === 'captain') drawCrown(ctx);
  ctx.restore();
}

function drawWings(ctx: CanvasRenderingContext2D, b: Bee, p: BeePalette): void {
  const flapSpeed = b.state === 'formation' ? 8 : 14;
  const baseSpread = b.state === 'formation' ? 0.7 : 1;
  const flap = baseSpread + Math.sin(b.wingT * flapSpeed) * 0.25;
  ctx.fillStyle = p.wing;
  ctx.strokeStyle = p.wingStroke;
  ctx.lineWidth = 0.8;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * 9 * flap, -1, 8 * flap, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawBody(ctx: CanvasRenderingContext2D, p: BeePalette): void {
  ctx.fillStyle = p.body;
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = p.stripe;
  for (const dy of [-3.5, 0.5, 4]) {
    ctx.beginPath();
    ctx.ellipse(0, dy, 8.5, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = p.outline;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawFace(ctx: CanvasRenderingContext2D, b: Bee, p: BeePalette): void {
  ctx.fillStyle = p.eye;
  ctx.beginPath();
  ctx.arc(-2.8, -5.2, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(2.8, -5.2, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = p.antenna;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-2.5, -8);
  ctx.lineTo(-4.5, -11);
  ctx.moveTo(2.5, -8);
  ctx.lineTo(4.5, -11);
  ctx.stroke();
  ctx.fillStyle = p.antenna;
  ctx.beginPath();
  ctx.arc(-4.5, -11, 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(4.5, -11, 0.9, 0, Math.PI * 2);
  ctx.fill();
  if (b.state === 'diving') {
    ctx.fillStyle = p.outline;
    ctx.beginPath();
    ctx.arc(0, -2, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 隊長頭頂的小皇冠 — 三尖齒金色,有黑邊提升對比 */
function drawCrown(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.fillStyle = '#fbbf24';
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 0.8;
  // 皇冠基底
  ctx.fillRect(-4.5, -13.5, 9, 1.8);
  ctx.strokeRect(-4.5, -13.5, 9, 1.8);
  // 三尖齒
  ctx.beginPath();
  ctx.moveTo(-4.5, -13.5);
  ctx.lineTo(-3, -16);
  ctx.lineTo(-1.5, -13.5);
  ctx.lineTo(0, -17);
  ctx.lineTo(1.5, -13.5);
  ctx.lineTo(3, -16);
  ctx.lineTo(4.5, -13.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // 三尖齒上紅寶石點綴
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(-3, -15, 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -16, 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(3, -15, 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
