// 玩家 cube + 障礙物(spike / block)繪製
//
// 玩家 cube:30×30 粉紅方塊 + 黑邊 + 中央兩個小眼睛,空中持續旋轉,
// 落地後 snap 到 90°。障礙物以世界 x 表示,渲染前減 cameraX 得螢幕 x。

import { CFG, type Obstacle, type PlayerState } from './types';

export function drawCube(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  alive: boolean,
): void {
  if (!alive && player.deadAt) return; // 死亡後停止繪製本體,改由粒子表示
  const cx = CFG.playerX;
  const cy = CFG.ground + player.y - CFG.playerSize / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(player.rotation);

  const s = CFG.playerSize;
  const half = s / 2;

  // 主體(粉紅漸層)
  const grad = ctx.createLinearGradient(-half, -half, half, half);
  grad.addColorStop(0, '#fb7185');
  grad.addColorStop(1, '#be185d');
  ctx.fillStyle = grad;
  ctx.fillRect(-half, -half, s, s);

  // 內部紋路(色塊)
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(-half + 3, -half + 3, s - 6, 5);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(-half + 3, half - 8, s - 6, 5);

  // 眼睛(GD 經典標誌風)
  ctx.fillStyle = '#fff';
  ctx.fillRect(-7, -3, 4, 6);
  ctx.fillRect(3, -3, 4, 6);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-6, -1, 2, 3);
  ctx.fillRect(4, -1, 2, 3);

  // 黑邊
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.strokeRect(-half, -half, s, s);

  ctx.restore();
}

export function drawObstacles(
  ctx: CanvasRenderingContext2D,
  obstacles: ReadonlyArray<Obstacle>,
  cameraX: number,
): void {
  for (const ob of obstacles) {
    if (ob.kind === 'spike') drawSpike(ctx, ob.x - cameraX);
    else if (ob.kind === 'block') drawBlock(ctx, ob.x - cameraX, ob.w, ob.h);
  }
}

function drawSpike(ctx: CanvasRenderingContext2D, sx: number): void {
  // 螢幕外不畫
  if (sx < -CFG.tile || sx > CFG.width + CFG.tile) return;
  const baseY = CFG.ground;
  const tipY = CFG.ground - CFG.tile;
  const left = sx + 3;
  const right = sx + CFG.tile - 3;
  const mid = (left + right) / 2;

  // 漸層三角(白尖紅底)
  const grad = ctx.createLinearGradient(0, tipY, 0, baseY);
  grad.addColorStop(0, '#fef3c7');
  grad.addColorStop(0.4, '#fb7185');
  grad.addColorStop(1, '#7c2d12');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(left, baseY);
  ctx.lineTo(right, baseY);
  ctx.lineTo(mid, tipY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  sx: number,
  w: number,
  h: number,
): void {
  if (sx + w < 0 || sx > CFG.width) return;
  const top = CFG.ground - h;
  // 主體漸層
  const grad = ctx.createLinearGradient(0, top, 0, top + h);
  grad.addColorStop(0, '#a78bfa');
  grad.addColorStop(0.5, '#7c3aed');
  grad.addColorStop(1, '#312e81');
  ctx.fillStyle = grad;
  ctx.fillRect(sx, top, w, h);

  // 上沿亮邊
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(sx, top, w, 3);

  // 邊框
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(sx, top, w, h);

  // 內部分格紋(每 30px 一條)
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  for (let x = CFG.tile; x < w; x += CFG.tile) {
    ctx.beginPath();
    ctx.moveTo(sx + x, top);
    ctx.lineTo(sx + x, top + h);
    ctx.stroke();
  }
  for (let y = CFG.tile; y < h; y += CFG.tile) {
    ctx.beginPath();
    ctx.moveTo(sx, top + y);
    ctx.lineTo(sx + w, top + y);
    ctx.stroke();
  }
}
