// 場景背景：天空、星星、樹剪影、地面。

import { CFG } from './types';

export function drawSky(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, 0, 0, CFG.ground);
  g.addColorStop(0, '#1e1b4b');
  g.addColorStop(0.6, '#5b21b6');
  g.addColorStop(1, '#fb923c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CFG.width, CFG.ground);
}

export function drawStars(ctx: CanvasRenderingContext2D, time: number): void {
  // 用偽隨機固定星位，靠 time 做閃爍
  ctx.save();
  for (let i = 0; i < STAR_POSITIONS.length; i++) {
    const [x, y, base] = STAR_POSITIONS[i]!;
    const a = base + 0.3 * Math.sin(time * 2 + i);
    ctx.fillStyle = `rgba(255,255,255,${Math.max(0.15, a).toFixed(3)})`;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();
}

const STAR_POSITIONS: ReadonlyArray<readonly [number, number, number]> = (() => {
  const arr: Array<[number, number, number]> = [];
  let seed = 1234;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 50; i++) {
    arr.push([Math.floor(rand() * CFG.width), Math.floor(rand() * 200), 0.5 + rand() * 0.4]);
  }
  return arr;
})();

export function drawTrees(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#0f172a';
  const peaks = [
    [40, 380, 80],
    [140, 350, 100],
    [260, 360, 120],
    [410, 340, 130],
    [560, 365, 110],
    [700, 350, 100],
  ] as const;
  for (const [cx, baseY, h] of peaks) {
    ctx.beginPath();
    ctx.moveTo(cx - 50, baseY);
    ctx.lineTo(cx, baseY - h);
    ctx.lineTo(cx + 50, baseY);
    ctx.closePath();
    ctx.fill();
  }
}

export function drawGround(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, CFG.ground, 0, CFG.height);
  g.addColorStop(0, '#1e293b');
  g.addColorStop(1, '#0f172a');
  ctx.fillStyle = g;
  ctx.fillRect(0, CFG.ground, CFG.width, CFG.height - CFG.ground);
}
