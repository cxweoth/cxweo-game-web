// 6 種階梯的繪圖。

import { CFG, type Images, type Stair } from './types';
import { imageReady } from './render-utils';
import { drawFlip } from './render-flip';
import { drawSpikeBase, drawSpikeTips } from './render-spike';

export { drawSpikeTips };

export function drawStair(
  ctx: CanvasRenderingContext2D,
  s: Stair,
  images: Images | null,
  totalTime: number,
  elapsedSec: number,
): void {
  switch (s.type) {
    case 'conveyor':
      drawConveyor(ctx, s, totalTime);
      return;
    case 'crumbling':
      drawCrumbling(ctx, s, elapsedSec);
      return;
    case 'flip':
      drawFlip(ctx, s, elapsedSec);
      return;
    case 'spring':
      drawSpring(ctx, s, images, elapsedSec);
      return;
    case 'spike':
      drawSpikeBase(ctx, s);
      return;
    default:
      drawImageStair(ctx, s, images);
  }
}


/** 彈簧:踩下去會壓扁,然後阻尼餘弦回彈幾下再恢復 */
function drawSpring(
  ctx: CanvasRenderingContext2D,
  s: Stair,
  images: Images | null,
  elapsedSec: number,
): void {
  const scaleY = springScaleY(s, elapsedSec);
  // scale 鎖定在「彈簧底端」中心,模擬底座固定、頂端壓下/彈起
  const cx = s.x + CFG.stairW / 2;
  const cyBottom = s.y + CFG.stairH;
  ctx.save();
  if (scaleY !== 1) {
    ctx.translate(cx, cyBottom);
    ctx.scale(1, scaleY);
    ctx.translate(-cx, -cyBottom);
  }
  drawImageStair(ctx, s, images);
  ctx.restore();
}

/**
 * 阻尼餘弦:scaleY(t) = 1 - A * exp(-k*t) * cos(omega*t)
 *
 *   t=0          → 1 - A (壓到最扁)
 *   t≈pi/omega   → 第一次回彈;cos = -1,scaleY ≈ 1 + A*exp(-k*t) (略高於 1,有 overshoot)
 *   t→duration   → 收斂回 1
 */
function springScaleY(s: Stair, elapsedSec: number): number {
  if (s.pressedAtSec === undefined) return 1;
  const t = elapsedSec - s.pressedAtSec;
  if (t < 0 || t > CFG.springAnimDuration) return 1;
  const decay = Math.exp(-CFG.springAnimDecay * t);
  return 1 - CFG.springAnimAmp * decay * Math.cos(CFG.springAnimOmega * t);
}

function drawImageStair(ctx: CanvasRenderingContext2D, s: Stair, images: Images | null): void {
  if (images) {
    const img = stairImage(images, s.type);
    if (img && imageReady(img)) {
      ctx.drawImage(img, s.x, s.y, CFG.stairW, CFG.stairH);
      return;
    }
  }
  ctx.save();
  ctx.fillStyle = stairFallbackColor(s.type);
  ctx.fillRect(s.x, s.y, CFG.stairW, CFG.stairH);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(s.x, s.y, CFG.stairW, CFG.stairH);
  ctx.restore();
}

function stairImage(images: Images, type: Stair['type']): HTMLImageElement | null {
  switch (type) {
    case 'normal':
      return images.block;
    case 'spring':
      return images.spring;
    case 'conveyor':
      return images.conveyor;
    default:
      return null;
  }
}

function stairFallbackColor(type: Stair['type']): string {
  switch (type) {
    case 'normal':
      return '#198e99';
    case 'spike':
      return '#f70519';
    case 'spring':
      return '#facc15';
    case 'conveyor':
      return '#475569';
    case 'crumbling':
      return '#a8a29e';
    case 'flip':
      return '#7c3aed';
  }
}

/** 滾輪階:金屬框 + 黃色方向箭頭 + 兩端轉動的圓形滾筒 */
function drawConveyor(ctx: CanvasRenderingContext2D, s: Stair, totalTime: number): void {
  const dir = s.conveyorDir === 'left' ? -1 : 1;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.fillStyle = '#475569';
  ctx.fillRect(0, 0, CFG.stairW, CFG.stairH);
  const inX = 4;
  const inY = 4;
  const inW = CFG.stairW - 8;
  const inH = CFG.stairH - 8;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(inX, inY, inW, inH);
  // 動畫條紋(箭頭) — clip 在內部矩形,避免箭頭跑出階梯框
  ctx.save();
  ctx.beginPath();
  ctx.rect(inX, inY, inW, inH);
  ctx.clip();
  const stripeW = 14;
  const offset = (((totalTime * 90 * dir) % stripeW) + stripeW) % stripeW;
  ctx.fillStyle = 'rgba(251,191,36,0.85)';
  for (let i = -1; i < inW / stripeW + 2; i++) {
    const x = inX + i * stripeW + offset;
    drawArrow(ctx, x + stripeW * 0.2, inY + inH * 0.5, 8, inH - 4, dir);
  }
  ctx.restore();
  // 兩側滾筒(轉動)
  const rollerR = inH / 2;
  for (const rx of [inX + rollerR, inX + inW - rollerR]) {
    ctx.save();
    ctx.translate(rx, inY + inH / 2);
    ctx.rotate(totalTime * 6 * dir);
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, 0, rollerR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * rollerR, Math.sin(a) * rollerR);
      ctx.stroke();
    }
    ctx.restore();
  }
  // 鉚釘
  ctx.fillStyle = '#cbd5e1';
  for (const cx of [3, CFG.stairW - 3]) {
    for (const cy of [3, CFG.stairH - 3]) {
      ctx.beginPath();
      ctx.arc(cx, cy, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, CFG.stairW, CFG.stairH);
  ctx.restore();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  dir: -1 | 1,
): void {
  ctx.beginPath();
  if (dir > 0) {
    ctx.moveTo(cx - w / 2, cy - h / 2);
    ctx.lineTo(cx + w / 2, cy);
    ctx.lineTo(cx - w / 2, cy + h / 2);
    ctx.lineTo(cx - w / 4, cy);
  } else {
    ctx.moveTo(cx + w / 2, cy - h / 2);
    ctx.lineTo(cx - w / 2, cy);
    ctx.lineTo(cx + w / 2, cy + h / 2);
    ctx.lineTo(cx + w / 4, cy);
  }
  ctx.closePath();
  ctx.fill();
}

/** 碎裂階:踩到後依進度顯示裂痕 + 落塊,結束消失 */
function drawCrumbling(
  ctx: CanvasRenderingContext2D,
  s: Stair,
  elapsedSec: number,
): void {
  let progress = 0;
  if (s.triggeredAtSec !== undefined) {
    progress = Math.min(1, (elapsedSec - s.triggeredAtSec) / CFG.crumbleDurationSec);
  }
  if (progress >= 1) return;

  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.globalAlpha = 1 - progress * 0.85;

  const grd = ctx.createLinearGradient(0, 0, 0, CFG.stairH);
  grd.addColorStop(0, '#a8a29e');
  grd.addColorStop(1, '#57534e');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, CFG.stairW, CFG.stairH);

  // 預設細紋
  ctx.strokeStyle = '#44403c';
  ctx.lineWidth = 1;
  for (const [x1, y1, x2, y2] of [
    [22, 4, 32, 24],
    [70, 6, 80, 22],
    [100, 4, 115, 26],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // 觸發後加深的裂痕
  if (progress > 0) {
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 1 + progress * 2;
    for (const [x1, y1, x2, y2] of [
      [25, 0, 38, CFG.stairH],
      [55, 0, 50, CFG.stairH],
      [88, 0, 78, CFG.stairH],
      [125, 0, 132, CFG.stairH],
    ] as const) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, CFG.stairW, CFG.stairH);

  // 後段:碎塊往下掉
  if (progress > 0.6) {
    const fall = (progress - 0.6) / 0.4;
    ctx.fillStyle = '#a8a29e';
    for (let i = 0; i < 6; i++) {
      const x = 12 + i * 24;
      const y = CFG.stairH + fall * 20;
      ctx.fillRect(x, y, 8, 6);
    }
  }
  ctx.restore();
}
