// 節奏方塊 — 粒子工具(死亡爆裂 + 落地塵土)

import type { Particle } from './types';

const GRAVITY = 1400;
const FRICTION = 0.94;

export function spawnDeathParticles(list: Particle[], x: number, y: number): void {
  const colors = ['#fb7185', '#f43f5e', '#fbbf24', '#fde68a', '#a78bfa', '#fff'];
  for (let i = 0; i < 32; i++) {
    const ang = Math.random() * Math.PI * 2;
    const sp = 220 + Math.random() * 380;
    list.push({
      x,
      y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp - 120,
      age: 0,
      ttl: 0.7 + Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      r: 2 + Math.random() * 2.5,
    });
  }
}

export function spawnLandDust(list: Particle[], x: number, y: number): void {
  for (let i = 0; i < 6; i++) {
    const dir = Math.random() < 0.5 ? -1 : 1;
    list.push({
      x,
      y,
      vx: dir * (40 + Math.random() * 100),
      vy: -(40 + Math.random() * 80),
      age: 0,
      ttl: 0.32 + Math.random() * 0.18,
      color: 'rgba(253,224,71,0.7)',
      r: 1.4 + Math.random() * 1.4,
    });
  }
}

export function updateParticles(list: Particle[], dt: number): Particle[] {
  for (const p of list) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += GRAVITY * dt;
    p.vx *= FRICTION;
    p.age += dt;
  }
  return list.filter((p) => p.age < p.ttl);
}
