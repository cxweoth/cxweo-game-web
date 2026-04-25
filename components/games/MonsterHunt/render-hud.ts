// 畫面 HUD：左上玩家紅心、右上怪物紫心。

import { CFG } from './types';

export function drawHP(
  ctx: CanvasRenderingContext2D,
  playerHP: number,
  monsterHP: number,
): void {
  drawHearts(ctx, 12, 12, CFG.playerHP, playerHP, '#ef4444');
  const w = CFG.monsterHP * 18 + 4;
  drawHearts(ctx, CFG.width - w - 12, 12, CFG.monsterHP, monsterHP, '#a855f7');
}

function drawHearts(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  total: number,
  filled: number,
  color: string,
): void {
  const size = 14;
  const gap = 4;
  for (let i = 0; i < total; i++) {
    const x = x0 + i * (size + gap);
    drawHeart(
      ctx,
      x + size / 2,
      y0 + size / 2,
      size,
      i < filled ? color : 'rgba(255,255,255,0.25)',
    );
  }
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  const k = size / 16;
  ctx.moveTo(cx, cy + 4 * k);
  ctx.bezierCurveTo(cx + 7 * k, cy - 3 * k, cx + 6 * k, cy - 9 * k, cx, cy - 4 * k);
  ctx.bezierCurveTo(cx - 6 * k, cy - 9 * k, cx - 7 * k, cy - 3 * k, cx, cy + 4 * k);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
