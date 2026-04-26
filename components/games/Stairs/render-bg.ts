// 下樓梯背景與天花板。

import { CFG, type Images } from './types';
import { imageReady } from './render-utils';

export function drawBackground(ctx: CanvasRenderingContext2D, images: Images | null): void {
  if (images && imageReady(images.bg)) {
    ctx.drawImage(images.bg, 0, 0, CFG.width, CFG.height);
    return;
  }
  const g = ctx.createLinearGradient(0, 0, 0, CFG.height);
  g.addColorStop(0, '#0c1426');
  g.addColorStop(1, '#1f2937');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CFG.width, CFG.height);
}

export function drawCeiling(ctx: CanvasRenderingContext2D, images: Images | null): void {
  if (images && imageReady(images.top)) {
    ctx.drawImage(images.top, 0, 0, CFG.width, CFG.ceilingImageH);
    return;
  }
  ctx.save();
  const grd = ctx.createLinearGradient(0, 0, 0, CFG.ceilingImageH);
  grd.addColorStop(0, '#7f1d1d');
  grd.addColorStop(1, '#dc2626');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, CFG.width, CFG.ceilingImageH);
  ctx.restore();
}
