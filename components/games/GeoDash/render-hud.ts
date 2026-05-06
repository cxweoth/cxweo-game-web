// HUD:進度條(關卡)/ 距離(無盡)/ 操作提示

import { LEVEL_END_X } from './level';
import { CFG } from './types';

export function drawHUD(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  isEndless: boolean,
  best: number | null,
  showJumpHint: boolean,
): void {
  ctx.font = 'bold 14px ui-sans-serif, system-ui';
  ctx.textBaseline = 'top';

  if (isEndless) {
    const m = Math.floor(cameraX);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fef3c7';
    ctx.fillText(`距離: ${m}`, 14, 14);
    if (best !== null && best > 0) {
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(254,243,199,0.7)';
      ctx.fillText(`最遠: ${best}`, CFG.width - 14, 14);
    }
  } else {
    // 進度條
    const ratio = Math.min(1, cameraX / LEVEL_END_X);
    const barW = CFG.width - 60;
    const x = 30;
    const y = 18;
    const h = 10;
    ctx.fillStyle = 'rgba(15,23,42,0.55)';
    ctx.fillRect(x - 1, y - 1, barW + 2, h + 2);
    ctx.fillStyle = '#27272a';
    ctx.fillRect(x, y, barW, h);
    const grad = ctx.createLinearGradient(x, 0, x + barW, 0);
    grad.addColorStop(0, '#fb7185');
    grad.addColorStop(0.5, '#a78bfa');
    grad.addColorStop(1, '#fbbf24');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, barW * ratio, h);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x, y, barW, 3);
    // % 文字
    ctx.font = 'bold 12px ui-monospace, monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(ratio * 100)}%`, x + barW / 2, y + 11);
  }

  if (showJumpHint) {
    ctx.font = 'bold 18px ui-sans-serif, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(15,23,42,0.55)';
    ctx.fillRect(CFG.width / 2 - 160, CFG.height / 2 - 32, 320, 56);
    ctx.fillStyle = '#fef3c7';
    ctx.fillText('點擊任意處 / 按空白 開始', CFG.width / 2, CFG.height / 2 - 6);
    ctx.font = '13px ui-sans-serif, system-ui';
    ctx.fillStyle = 'rgba(254,243,199,0.85)';
    ctx.fillText('長按或連點 = 連跳', CFG.width / 2, CFG.height / 2 + 14);
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}
