// Pacman + Ghost 繪製
//
// Pacman:黃圓 + 嘴開合(角度依 dir、開合度依 mouthPhase 取絕對值正弦)。
// Ghost:上半圓 + 矩形身體 + 底部 4 鋸齒,加白眼睛(瞳孔朝 dir)。
//   frightened:藍色身體 + 紅嘴白眼;倒數最後 2s 在藍/白間閃爍。
//   eaten:只畫眼睛(身體透明)。

import { CFG, type Ghost, type GhostKind, type Pacman } from './types';

const GHOST_COLOR: Record<GhostKind, string> = {
  blinky: '#ef4444',
  pinky: '#f9a8d4',
  inky: '#22d3ee',
  clyde: '#fb923c',
};

export function drawPacman(
  ctx: CanvasRenderingContext2D,
  p: Pacman,
  alive: boolean,
): void {
  const r = CFG.cell * 0.44;
  const cx = p.x;
  const cy = p.y;

  if (!alive) {
    // 死亡漸縮(由 Pacman 主元件控制 mouth 從 0 → π,我們也讀 mouthPhase)
    const open = Math.min(Math.PI, p.mouthPhase);
    const baseAng = -Math.PI / 2; // 朝上開
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, baseAng + open / 2, baseAng - open / 2 + Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    return;
  }

  const open = (Math.abs(Math.sin(p.mouthPhase)) * 0.55 + 0.05) * Math.PI;
  let baseAng = 0;
  switch (p.dir) {
    case 'right': baseAng = 0; break;
    case 'left': baseAng = Math.PI; break;
    case 'up': baseAng = -Math.PI / 2; break;
    case 'down': baseAng = Math.PI / 2; break;
    case 'none': baseAng = 0; break;
  }
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, baseAng + open / 2, baseAng - open / 2 + Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  // 眼睛(小黑點,在 baseAng 垂直上方)
  const eyeAng = baseAng - Math.PI / 2;
  const ex = cx + Math.cos(eyeAng) * r * 0.45;
  const ey = cy + Math.sin(eyeAng) * r * 0.45;
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(ex, ey, r * 0.13, 0, Math.PI * 2);
  ctx.fill();
}

export function drawGhost(
  ctx: CanvasRenderingContext2D,
  g: Ghost,
  globalFrightT: number,
  time: number,
): void {
  const r = CFG.cell * 0.44;
  const cx = g.x;
  const cy = g.y;
  const isFright = g.mode === 'frightened';
  const isEaten = g.mode === 'eaten';

  // 結束前 2s 閃爍
  const fightFlashing =
    isFright && globalFrightT > 0 && globalFrightT <= CFG.frightFlashStart;
  const flashOn = fightFlashing && Math.sin(time * 12) > 0;

  if (!isEaten) {
    if (isFright) {
      ctx.fillStyle = flashOn ? '#fef3c7' : '#1d4ed8';
    } else {
      ctx.fillStyle = GHOST_COLOR[g.kind];
    }
    drawGhostBody(ctx, cx, cy, r, time + (g.kind.charCodeAt(0) % 4) * 0.3);
  }

  // 眼睛(frightened 模式不畫眼,改畫嘴)
  if (isFright) {
    if (!isEaten) {
      // 紅嘴 + 白眼
      ctx.fillStyle = flashOn ? '#dc2626' : '#fff';
      // 兩個小方眼
      ctx.fillRect(cx - r * 0.45, cy - r * 0.05, r * 0.3, r * 0.3);
      ctx.fillRect(cx + r * 0.15, cy - r * 0.05, r * 0.3, r * 0.3);
      // 鋸齒嘴
      ctx.strokeStyle = flashOn ? '#dc2626' : '#fff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const my = cy + r * 0.4;
      ctx.moveTo(cx - r * 0.55, my);
      ctx.lineTo(cx - r * 0.3, my - 4);
      ctx.lineTo(cx - r * 0.05, my);
      ctx.lineTo(cx + r * 0.2, my - 4);
      ctx.lineTo(cx + r * 0.45, my);
      ctx.lineTo(cx + r * 0.55, my - 2);
      ctx.stroke();
    }
  } else {
    // 正常 / eaten 都畫眼睛 + 瞳孔朝 dir
    drawGhostEyes(ctx, cx, cy, r, g);
  }
}

function drawGhostBody(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  phase: number,
): void {
  // 上半圓 + 矩形身體
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.1, r, Math.PI, 0);
  // 底部用 4 個鋸齒
  const baseY = cy + r * 0.85;
  const wobble = Math.sin(phase * 6) * 2;
  ctx.lineTo(cx + r, baseY + wobble);
  for (let i = 3; i >= 0; i--) {
    const x1 = cx + r * (i * 0.5 - 1);
    const x2 = cx + r * (i * 0.5 - 1.25);
    ctx.lineTo(x1 + 0.1, baseY - r * 0.18 + wobble);
    ctx.lineTo(x2 + 0.1, baseY + wobble);
  }
  ctx.closePath();
  ctx.fill();
}

function drawGhostEyes(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  g: Ghost,
): void {
  const ex = r * 0.32;
  const ey = -r * 0.05;
  const ew = r * 0.32;
  const eh = r * 0.4;
  // 眼白
  ctx.fillStyle = '#fff';
  drawEllipse(ctx, cx - ex, cy + ey, ew, eh);
  drawEllipse(ctx, cx + ex, cy + ey, ew, eh);
  // 瞳孔(朝 dir)
  const pdx =
    g.dir === 'left' ? -1 : g.dir === 'right' ? 1 : 0;
  const pdy =
    g.dir === 'up' ? -1 : g.dir === 'down' ? 1 : 0;
  const offX = pdx * ew * 0.5;
  const offY = pdy * eh * 0.5;
  ctx.fillStyle = '#1e3a8a';
  drawEllipse(ctx, cx - ex + offX, cy + ey + offY, ew * 0.5, eh * 0.5);
  drawEllipse(ctx, cx + ex + offX, cy + ey + offY, ew * 0.5, eh * 0.5);
}

function drawEllipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): void {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}
