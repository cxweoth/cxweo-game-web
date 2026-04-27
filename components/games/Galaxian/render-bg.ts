// 滾動星空背景:三層視差,慢層遠星 + 快層近星。

import { CFG } from './types';

type Star = { x: number; y: number; r: number; speed: number; alpha: number };

let stars: Star[] = [];
let initialized = false;

function ensureStars(): void {
  if (initialized) return;
  initialized = true;
  // 三層深度:遠 / 中 / 近,各自不同數量、速度、亮度
  for (let i = 0; i < 40; i++) {
    stars.push({
      x: Math.random() * CFG.width,
      y: Math.random() * CFG.height,
      r: 0.6,
      speed: 14,
      alpha: 0.4,
    });
  }
  for (let i = 0; i < 25; i++) {
    stars.push({
      x: Math.random() * CFG.width,
      y: Math.random() * CFG.height,
      r: 1,
      speed: 32,
      alpha: 0.7,
    });
  }
  for (let i = 0; i < 12; i++) {
    stars.push({
      x: Math.random() * CFG.width,
      y: Math.random() * CFG.height,
      r: 1.6,
      speed: 60,
      alpha: 1,
    });
  }
}

export function drawBackground(ctx: CanvasRenderingContext2D, dt: number): void {
  ensureStars();
  // 純黑底
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, CFG.width, CFG.height);

  for (const s of stars) {
    s.y += s.speed * dt;
    if (s.y > CFG.height) {
      s.y = -2;
      s.x = Math.random() * CFG.width;
    }
    ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
    ctx.fillRect(s.x, s.y, s.r * 2, s.r * 2);
  }
}
