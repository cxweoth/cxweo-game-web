// HUD:分數 + 命數 + 高分

import { CANVAS_H, CANVAS_W, CFG } from './types';

export function drawHUD(
  ctx: CanvasRenderingContext2D,
  score: number,
  highScore: number,
  lives: number,
  level: number,
): void {
  const hudY = CANVAS_H - CFG.hudH;
  // 底色
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, hudY, CANVAS_W, CFG.hudH);
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, hudY);
  ctx.lineTo(CANVAS_W, hudY);
  ctx.stroke();

  ctx.font = 'bold 12px ui-monospace, monospace';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#fde68a';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE', 10, hudY + 6);
  ctx.font = 'bold 18px ui-monospace, monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText(`${score}`.padStart(6, '0'), 10, hudY + 22);

  ctx.font = 'bold 12px ui-monospace, monospace';
  ctx.fillStyle = '#fde68a';
  ctx.textAlign = 'right';
  ctx.fillText('HIGH', CANVAS_W - 10, hudY + 6);
  ctx.font = 'bold 18px ui-monospace, monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText(
    `${Math.max(score, highScore)}`.padStart(6, '0'),
    CANVAS_W - 10,
    hudY + 22,
  );

  // 中央顯示 LV / 命
  ctx.textAlign = 'center';
  ctx.font = 'bold 12px ui-monospace, monospace';
  ctx.fillStyle = '#fde68a';
  ctx.fillText(`LV ${level}`, CANVAS_W / 2, hudY + 6);

  // 命數:小 Pacman 圖示
  for (let i = 0; i < lives - 1; i++) {
    const cx = CANVAS_W / 2 - 18 + i * 18;
    const cy = hudY + 36;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0.6, -0.6 + Math.PI * 2);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}
