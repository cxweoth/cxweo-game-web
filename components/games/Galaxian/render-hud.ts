// HUD:中文分數 / 命 / 波次 / 最高紀錄。
// 文字大、有黑色描邊,在星空背景上看得清楚。

import { CFG } from './types';
import { drawShip } from './render-ship';

export function drawHUD(
  ctx: CanvasRenderingContext2D,
  score: number,
  best: number | null,
  lives: number,
  wave: number,
): void {
  ctx.save();
  // 上方分數帶
  ctx.font = 'bold 22px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillStyle = '#fef3c7';
  ctx.strokeText(`分數 ${score}`, 10, 8);
  ctx.fillText(`分數 ${score}`, 10, 8);

  // 右上角:第幾波
  ctx.textAlign = 'right';
  ctx.strokeText(`第 ${wave} 波`, CFG.width - 10, 8);
  ctx.fillText(`第 ${wave} 波`, CFG.width - 10, 8);

  // 第二行(較小):最高紀錄
  if (best !== null) {
    ctx.font = 'bold 14px ui-sans-serif, system-ui, sans-serif';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'left';
    ctx.strokeText(`最高紀錄 ${best}`, 10, 36);
    ctx.fillText(`最高紀錄 ${best}`, 10, 36);
  }

  // 左下角命數:用迷你飛機 icon 排
  drawLivesIcons(ctx, lives);
  ctx.restore();
}

function drawLivesIcons(ctx: CanvasRenderingContext2D, lives: number): void {
  ctx.save();
  ctx.font = 'bold 14px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillStyle = '#fef3c7';
  const labelY = CFG.height - 20;
  ctx.strokeText('命', 10, labelY);
  ctx.fillText('命', 10, labelY);
  // 後面接 N 個迷你飛機 icon
  for (let i = 0; i < lives; i++) {
    drawMiniShip(ctx, 38 + i * 26, labelY);
  }
  ctx.restore();
}

function drawMiniShip(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  // 用真正的 drawShip,scale 0.55;只畫機身那層,不畫火焰/閃爍
  // 簡化:直接用同一份畫 fn 但縮放 + 鎖定 invuln=0
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(0.55, 0.55);
  ctx.translate(-cx, -cy);
  drawShip(ctx, { x: cx, y: cy, invuln: 0 }, 0);
  ctx.restore();
}
