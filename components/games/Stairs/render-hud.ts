// HUD:分數、最佳、HP bar

import { CFG } from './types';

export function drawHUD(
  ctx: CanvasRenderingContext2D,
  hp: number,
  score: number,
  best: number | null,
): void {
  ctx.save();
  ctx.font = 'bold 24px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(0,0,0,0.75)';
  ctx.fillStyle = '#fff';
  ctx.strokeText(`階梯第 ${score} 階`, CFG.width / 2, 6);
  ctx.fillText(`階梯第 ${score} 階`, CFG.width / 2, 6);
  if (best !== null) {
    ctx.font = 'bold 14px ui-sans-serif, system-ui, sans-serif';
    ctx.lineWidth = 4;
    ctx.strokeText(`最高紀錄 ${best}`, CFG.width / 2, 34);
    ctx.fillText(`最高紀錄 ${best}`, CFG.width / 2, 34);
  }
  ctx.restore();
  drawHPBar(ctx, hp);
}

function drawHPBar(ctx: CanvasRenderingContext2D, hp: number): void {
  const x = 10;
  const y = 60;
  const w = 200;
  const h = 18;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(x, y, w, h);
  const ratio = Math.max(0, hp / CFG.maxHP);
  const color = ratio > 0.5 ? '#22c55e' : ratio > 0.25 ? '#facc15' : '#ef4444';
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * ratio, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  for (let i = 1; i < CFG.maxHP; i++) {
    const xi = x + (w * i) / CFG.maxHP;
    ctx.beginPath();
    ctx.moveTo(xi, y);
    ctx.lineTo(xi, y + h);
    ctx.stroke();
  }
  ctx.font = 'bold 16px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.fillStyle = '#fff';
  const label = `生命值 ${hp} / ${CFG.maxHP}`;
  ctx.strokeText(label, x, y + h + 3);
  ctx.fillText(label, x, y + h + 3);
  ctx.restore();
}
