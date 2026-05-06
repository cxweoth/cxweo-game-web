// 粒子繪製

import type { Particle } from './types';

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
