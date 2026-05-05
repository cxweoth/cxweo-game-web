// 粒子 / 飛字繪製

import type { FloatText, Particle } from './types';

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  for (const p of particles) {
    const a = 1 - p.age / p.ttl;
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawFloatTexts(ctx: CanvasRenderingContext2D, texts: FloatText[]): void {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 18px ui-sans-serif, system-ui';
  for (const t of texts) {
    const a = 1 - t.age / t.ttl;
    ctx.globalAlpha = Math.max(0, a);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(15,23,42,0.85)';
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}
