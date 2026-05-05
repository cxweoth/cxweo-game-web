// 劍盾決鬥 — 粒子 / 飛字 / 螢幕震動工具

import type { FloatText, Particle, Shake } from './types';

const GRAVITY = 1100;
const PARTICLE_FRICTION = 0.92;

export function spawnHitParticles(
  list: Particle[],
  x: number,
  y: number,
  side: 'player' | 'boss',
): void {
  const colors =
    side === 'boss'
      ? ['#84cc16', '#65a30d', '#fde68a', '#fbbf24']
      : ['#3b82f6', '#60a5fa', '#fef3c7', '#fbbf24'];
  for (let i = 0; i < 14; i++) {
    const ang = Math.random() * Math.PI * 2;
    const sp = 120 + Math.random() * 200;
    list.push({
      x,
      y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp - 90,
      age: 0,
      ttl: 0.45 + Math.random() * 0.25,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      r: 1.6 + Math.random() * 1.6,
    });
  }
}

export function spawnDeathParticles(
  list: Particle[],
  x: number,
  y: number,
  side: 'player' | 'boss',
): void {
  const colors =
    side === 'boss'
      ? ['#84cc16', '#65a30d', '#16a34a', '#fde68a', '#dc2626']
      : ['#3b82f6', '#60a5fa', '#1d4ed8', '#fef3c7', '#dc2626'];
  for (let i = 0; i < 28; i++) {
    const ang = Math.random() * Math.PI * 2;
    const sp = 180 + Math.random() * 280;
    list.push({
      x,
      y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp - 220,
      age: 0,
      ttl: 0.7 + Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      r: 2 + Math.random() * 2.4,
    });
  }
}

/** 盾擋住攻擊時的火星 */
export function spawnBlockSparks(list: Particle[], x: number, y: number): void {
  for (let i = 0; i < 8; i++) {
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.3;
    const sp = 160 + Math.random() * 160;
    list.push({
      x,
      y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      age: 0,
      ttl: 0.3 + Math.random() * 0.2,
      color: Math.random() < 0.5 ? '#fde68a' : '#fff',
      r: 1.2 + Math.random() * 1.4,
    });
  }
}

export function updateParticles(list: Particle[], dt: number): Particle[] {
  for (const p of list) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += GRAVITY * dt;
    p.vx *= PARTICLE_FRICTION;
    p.age += dt;
  }
  return list.filter((p) => p.age < p.ttl);
}

export function spawnFloatText(
  list: FloatText[],
  x: number,
  y: number,
  text: string,
  color: string,
): void {
  list.push({ x, y, vy: -60, age: 0, ttl: 0.85, text, color });
}

export function updateFloatTexts(list: FloatText[], dt: number): FloatText[] {
  for (const t of list) {
    t.y += t.vy * dt;
    t.vy += 60 * dt; // 緩慢減速
    t.age += dt;
  }
  return list.filter((t) => t.age < t.ttl);
}

export function computeShake(shake: Shake | null, nowMs: number): { dx: number; dy: number } {
  if (!shake) return { dx: 0, dy: 0 };
  const elapsed = nowMs - shake.startMs;
  if (elapsed >= shake.durationMs) return { dx: 0, dy: 0 };
  const t = elapsed / shake.durationMs;
  const decay = 1 - t;
  const amp = shake.intensity * decay;
  return {
    dx: (Math.random() - 0.5) * amp * 2,
    dy: (Math.random() - 0.5) * amp * 2,
  };
}
