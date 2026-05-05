// HUD:玩家 / 怪物 HP 條 + 標籤

import { CFG } from './types';

export function drawHUD(
  ctx: CanvasRenderingContext2D,
  playerHP: number,
  bossHP: number,
): void {
  drawHpBar(ctx, 16, 16, 220, 14, playerHP / CFG.playerHP, '騎士', '#3b82f6');
  drawHpBar(
    ctx,
    CFG.width - 236,
    16,
    220,
    14,
    bossHP / CFG.bossHP,
    '哥布林戰士',
    '#84cc16',
    true,
  );
}

function drawHpBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ratio: number,
  label: string,
  color: string,
  rightAlign = false,
): void {
  const r = Math.max(0, Math.min(1, ratio));
  // 標籤
  ctx.font = 'bold 12px ui-sans-serif, system-ui';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = rightAlign ? 'right' : 'left';
  ctx.fillText(label, rightAlign ? x + w : x, y - 2);
  // 背景
  ctx.fillStyle = 'rgba(15,23,42,0.55)';
  ctx.fillRect(x - 1, y + 12, w + 2, h + 2);
  ctx.fillStyle = '#27272a';
  ctx.fillRect(x, y + 13, w, h);
  // 血條
  ctx.fillStyle = color;
  if (rightAlign) {
    ctx.fillRect(x + w - w * r, y + 13, w * r, h);
  } else {
    ctx.fillRect(x, y + 13, w * r, h);
  }
  // 高光
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(x, y + 13, w, 3);
  // 數字
  ctx.font = 'bold 11px ui-monospace, monospace';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const pct = Math.round(r * 100);
  ctx.fillText(`${pct}%`, x + w / 2, y + 20);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}
