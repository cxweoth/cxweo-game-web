// 接球的所有繪圖 — 純函式集合。

import { CFG, type Ball, type Popup } from './types';

type DrawState = {
  paddleX: number;
  balls: ReadonlyArray<Ball>;
  popups: ReadonlyArray<Popup>;
  score: number;
  lives: number;
  best: number | null;
  /** 累積時間(秒) — 給雲飄動 */
  time: number;
  /** 受擊閃光終點 (performance.now ms) */
  catchFlashUntil: number;
  missFlashUntil: number;
  nowMs: number;
};

export function drawScene(ctx: CanvasRenderingContext2D, s: DrawState): void {
  ctx.clearRect(0, 0, CFG.width, CFG.height);

  drawSky(ctx);
  drawClouds(ctx, s.time);
  drawGround(ctx);

  drawPaddle(ctx, s.paddleX, s.catchFlashUntil > s.nowMs);
  for (const b of s.balls) drawBall(ctx, b);
  for (const p of s.popups) drawPopup(ctx, p);

  // 漏球紅色邊緣閃光
  if (s.missFlashUntil > s.nowMs) drawMissFlash(ctx, s.missFlashUntil - s.nowMs);

  drawHUD(ctx, s.score, s.lives, s.best);
}

// --- 背景 ---

function drawSky(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, 0, 0, CFG.height);
  g.addColorStop(0, '#7dd3fc');
  g.addColorStop(0.7, '#bae6fd');
  g.addColorStop(1, '#e0f2fe');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CFG.width, CFG.height);
}

function drawClouds(ctx: CanvasRenderingContext2D, time: number): void {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  // 三朵雲緩慢飄動
  const clouds = [
    { x0: 100, y: 80, scale: 1.0 },
    { x0: 380, y: 50, scale: 1.3 },
    { x0: 620, y: 110, scale: 0.85 },
  ];
  for (const c of clouds) {
    const x = ((c.x0 + time * 12) % (CFG.width + 200)) - 100;
    const r = 22 * c.scale;
    ctx.beginPath();
    ctx.arc(x, c.y, r, 0, Math.PI * 2);
    ctx.arc(x + r * 0.9, c.y - r * 0.5, r * 0.85, 0, Math.PI * 2);
    ctx.arc(x + r * 1.7, c.y, r * 0.95, 0, Math.PI * 2);
    ctx.arc(x + r * 0.7, c.y + r * 0.3, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawGround(ctx: CanvasRenderingContext2D): void {
  // 地面在籃子下方
  const top = CFG.paddleY + CFG.paddleH / 2 + 12;
  const g = ctx.createLinearGradient(0, top, 0, CFG.height);
  g.addColorStop(0, '#86efac');
  g.addColorStop(1, '#4d7c0f');
  ctx.fillStyle = g;
  ctx.fillRect(0, top, CFG.width, CFG.height - top);
}

// --- 籃子 ---

function drawPaddle(ctx: CanvasRenderingContext2D, x: number, flashing: boolean): void {
  const w = CFG.paddleW;
  const h = CFG.paddleH;
  const left = x - w / 2;
  const top = CFG.paddleY - h / 2;
  ctx.save();
  // 影子
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, CFG.paddleY + h, w / 2.2, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 籃子主體（圓角矩形）
  const grd = ctx.createLinearGradient(0, top, 0, top + h);
  if (flashing) {
    grd.addColorStop(0, '#86efac');
    grd.addColorStop(1, '#15803d');
  } else {
    grd.addColorStop(0, '#60a5fa');
    grd.addColorStop(1, '#1d4ed8');
  }
  ctx.fillStyle = grd;
  roundRect(ctx, left, top, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

// --- 球 ---

function drawBall(ctx: CanvasRenderingContext2D, b: Ball): void {
  ctx.save();
  // 影子（地面投影）
  const shadowY = CFG.height - 6;
  if (b.y < shadowY) {
    const ratio = Math.min(1, b.y / CFG.height);
    ctx.fillStyle = `rgba(0,0,0,${0.18 + ratio * 0.1})`;
    ctx.beginPath();
    ctx.ellipse(b.x, shadowY, b.r * 0.8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // 主體 + 漸層光澤
  const grd = ctx.createRadialGradient(b.x - b.r * 0.4, b.y - b.r * 0.4, b.r * 0.1, b.x, b.y, b.r);
  grd.addColorStop(0, '#ffffffaa');
  grd.addColorStop(0.4, b.color);
  grd.addColorStop(1, b.color);
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fill();
  // 邊框
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // 金球加閃星
  if (b.isGolden) {
    ctx.translate(b.x, b.y);
    ctx.rotate(b.spin);
    ctx.fillStyle = '#fef9c3';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(0, -b.r + 4, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(Math.PI / 2);
    }
  }
  ctx.restore();
}

// --- popup ---

function drawPopup(ctx: CanvasRenderingContext2D, p: Popup): void {
  const alpha = Math.max(0, 1 - p.age / p.ttl);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = 'bold 18px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#000';
  ctx.strokeText(p.text, p.x, p.y);
  ctx.fillStyle = p.color;
  ctx.fillText(p.text, p.x, p.y);
  ctx.restore();
}

// --- HUD ---

function drawHUD(
  ctx: CanvasRenderingContext2D,
  score: number,
  lives: number,
  best: number | null,
): void {
  // 分數左上
  ctx.save();
  ctx.font = 'bold 22px ui-sans-serif, system-ui, sans-serif';
  ctx.textBaseline = 'top';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.strokeText(`分數 ${score}`, 14, 12);
  ctx.fillText(`分數 ${score}`, 14, 12);

  // best
  if (best !== null) {
    ctx.font = '14px ui-sans-serif, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.strokeText(`最佳 ${best}`, 14, 40);
    ctx.fillText(`最佳 ${best}`, 14, 40);
  }
  ctx.restore();

  // 生命右上(紅心)
  drawHearts(ctx, lives);
}

function drawHearts(ctx: CanvasRenderingContext2D, lives: number): void {
  const total = CFG.maxLives;
  const size = 22;
  const gap = 6;
  const totalW = total * size + (total - 1) * gap;
  const x0 = CFG.width - totalW - 14;
  const y = 14;
  for (let i = 0; i < total; i++) {
    const cx = x0 + i * (size + gap) + size / 2;
    const cy = y + size / 2;
    drawHeart(ctx, cx, cy, size, i < lives ? '#ef4444' : 'rgba(255,255,255,0.25)');
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

// --- 漏球紅色閃光（畫面邊緣） ---

function drawMissFlash(ctx: CanvasRenderingContext2D, remainingMs: number): void {
  const alpha = Math.min(0.5, remainingMs / 600);
  ctx.save();
  const grd = ctx.createRadialGradient(
    CFG.width / 2,
    CFG.height / 2,
    CFG.height / 2,
    CFG.width / 2,
    CFG.height / 2,
    CFG.width / 2,
  );
  grd.addColorStop(0, 'rgba(239,68,68,0)');
  grd.addColorStop(1, `rgba(239,68,68,${alpha})`);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, CFG.width, CFG.height);
  ctx.restore();
}

// --- 共用工具 ---

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}
