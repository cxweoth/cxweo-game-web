// 純粹的 Canvas 繪圖函式集合 — 不持狀態、不做物理。
// 由 ArcheryCanvas 的每幀 rAF 呼叫。

import { CFG, type Arrow, type LandedArrow } from './types';

type DrawState = {
  angleDeg: number;
  /** 0–1，蓄力比例；非 charging 時為 0 */
  charging: boolean;
  power: number;
  /** 飛行中的箭（null = 無） */
  flying: Arrow | null;
  /** 已落下、保留顯示的箭 */
  landed: ReadonlyArray<LandedArrow>;
  wind: number;
};

export function drawScene(ctx: CanvasRenderingContext2D, state: DrawState): void {
  ctx.clearRect(0, 0, CFG.width, CFG.height);
  drawSky(ctx);
  drawGround(ctx);
  drawHills(ctx);
  drawTarget(ctx);
  for (const a of state.landed) drawStuckArrow(ctx, a);
  drawBow(ctx, state.angleDeg, state.charging, state.power, state.flying === null);
  if (state.charging) drawTrajectoryPreview(ctx, state.angleDeg, state.power, state.wind);
  if (state.flying) drawFlyingArrow(ctx, state.flying);
  drawWindIndicator(ctx, state.wind);
  if (state.charging) drawPowerBar(ctx, state.power);
}

// --- 背景 ---

function drawSky(ctx: CanvasRenderingContext2D): void {
  const grd = ctx.createLinearGradient(0, 0, 0, CFG.ground);
  grd.addColorStop(0, '#7ec8e3');
  grd.addColorStop(1, '#dbeafe');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, CFG.width, CFG.ground);
}

function drawGround(ctx: CanvasRenderingContext2D): void {
  const grd = ctx.createLinearGradient(0, CFG.ground, 0, CFG.height);
  grd.addColorStop(0, '#7a9b4a');
  grd.addColorStop(1, '#4d6b2a');
  ctx.fillStyle = grd;
  ctx.fillRect(0, CFG.ground, CFG.width, CFG.height - CFG.ground);
}

function drawHills(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#9bb874';
  ctx.beginPath();
  ctx.moveTo(0, CFG.ground);
  ctx.quadraticCurveTo(150, CFG.ground - 70, 320, CFG.ground - 20);
  ctx.quadraticCurveTo(500, CFG.ground - 90, 700, CFG.ground - 30);
  ctx.quadraticCurveTo(780, CFG.ground - 50, CFG.width, CFG.ground - 10);
  ctx.lineTo(CFG.width, CFG.ground);
  ctx.closePath();
  ctx.fill();
}

// --- 標靶（10 環，FITA 配色：金紅藍黑白） ---

function drawTarget(ctx: CanvasRenderingContext2D): void {
  const cx = CFG.targetX;
  const cy = CFG.targetY;
  const r = CFG.targetOuterR;

  // 支架
  ctx.fillStyle = '#5c4530';
  ctx.fillRect(cx - 4, cy + r, 8, CFG.ground - cy - r);
  // 三角支撐
  ctx.beginPath();
  ctx.moveTo(cx - 22, CFG.ground);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx + 22, CFG.ground);
  ctx.closePath();
  ctx.fill();

  // 5 個色帶（每帶 = 2 環），由外向內覆蓋
  const colors = ['#fafafa', '#1c1917', '#3b82f6', '#ef4444', '#facc15'];
  const radii = [10, 8, 6, 4, 2].map((n) => n * CFG.ringW);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = colors[i]!;
    ctx.beginPath();
    ctx.arc(cx, cy, radii[i]!, 0, Math.PI * 2);
    ctx.fill();
  }
  // 環的細線（每 10px）
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 10; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, i * CFG.ringW, 0, Math.PI * 2);
    ctx.stroke();
  }
  // 中心點
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

// --- 弓 ---

function drawBow(
  ctx: CanvasRenderingContext2D,
  angleDeg: number,
  charging: boolean,
  power: number,
  nocked: boolean,
): void {
  ctx.save();
  ctx.translate(CFG.bowX, CFG.bowY);
  ctx.rotate(-(angleDeg * Math.PI) / 180);

  // 弓身（弧）
  ctx.strokeStyle = '#5c2e0c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 36, -Math.PI / 2 - 0.6, Math.PI / 2 + 0.6, false);
  ctx.stroke();

  // 弓弦：蓄力時往後拉
  const pull = charging ? -power * 14 : 0;
  ctx.strokeStyle = '#3c2e25';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.lineTo(pull, 0);
  ctx.lineTo(0, 28);
  ctx.stroke();

  // 搭在弦上的箭（飛出後不畫）
  if (nocked) {
    drawArrowShape(ctx, pull, 0, 50);
  }

  ctx.restore();
}

/** 共用箭形，原點 = 箭尾，箭頭朝右（+x）；length 是箭身長 */
function drawArrowShape(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  length: number,
): void {
  const tipX = ox + length;
  // 箭桿
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(tipX, oy);
  ctx.stroke();
  // 箭頭
  ctx.fillStyle = '#444';
  ctx.beginPath();
  ctx.moveTo(tipX, oy);
  ctx.lineTo(tipX - 8, oy - 3.5);
  ctx.lineTo(tipX - 8, oy + 3.5);
  ctx.closePath();
  ctx.fill();
  // 箭尾羽毛
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox - 9, oy - 4);
  ctx.lineTo(ox - 4, oy);
  ctx.lineTo(ox - 9, oy + 4);
  ctx.closePath();
  ctx.fill();
}

// --- 預瞄虛線 ---

function drawTrajectoryPreview(
  ctx: CanvasRenderingContext2D,
  angleDeg: number,
  power: number,
  wind: number,
): void {
  const speed = CFG.minPower + (CFG.maxPower - CFG.minPower) * power;
  const a = (angleDeg * Math.PI) / 180;
  let x = CFG.bowX + 35;
  let y = CFG.bowY;
  let vx = speed * Math.cos(a);
  let vy = -speed * Math.sin(a);

  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 7]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i < 80; i++) {
    const dt = 0.03;
    vy += CFG.gravity * dt;
    vx += wind * dt;
    x += vx * dt;
    y += vy * dt;
    if (y > CFG.ground || x > CFG.targetX + 40 || x < 0 || y < -40) break;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

// --- 飛行中的箭 + 軌跡尾跡 ---

function drawFlyingArrow(ctx: CanvasRenderingContext2D, arrow: Arrow): void {
  if (arrow.trail.length > 1) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const first = arrow.trail[0]!;
    ctx.moveTo(first[0], first[1]);
    for (let i = 1; i < arrow.trail.length; i++) {
      const p = arrow.trail[i]!;
      ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(arrow.x, arrow.y);
  ctx.rotate(arrow.angle);
  // 箭桿從尾(-30) 到 箭頭(0)
  drawArrowShape(ctx, -30, 0, 30);
  ctx.restore();
}

// --- 已插下的箭 ---

function drawStuckArrow(ctx: CanvasRenderingContext2D, a: LandedArrow): void {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(a.angle);
  ctx.globalAlpha = 0.75;
  drawArrowShape(ctx, -28, 0, 28);
  ctx.restore();
}

// --- HUD ---

function drawWindIndicator(ctx: CanvasRenderingContext2D, wind: number): void {
  ctx.save();
  ctx.font = 'bold 16px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const x = CFG.width / 2;
  const y = 28;
  const text = wind === 0 ? '風 —' : `風 ${wind > 0 ? '→' : '←'} ${Math.abs(Math.round(wind))}`;
  // 背景小膠囊
  const w = 110;
  const h = 26;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  roundRect(ctx, x - w / 2, y - h / 2, w, h, 13);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.stroke();
  ctx.fillStyle = '#1e3a8a';
  ctx.fillText(text, x, y + 1);
  ctx.restore();
}

function drawPowerBar(ctx: CanvasRenderingContext2D, power: number): void {
  const x = CFG.bowX - 50;
  const y = CFG.bowY - 60;
  const w = 14;
  const h = 110;
  ctx.save();
  // 邊框與底
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  roundRect(ctx, x, y, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.stroke();
  // 填充
  const fillH = Math.max(0, h * power);
  const grd = ctx.createLinearGradient(0, y + h, 0, y);
  grd.addColorStop(0, '#22c55e');
  grd.addColorStop(0.6, '#facc15');
  grd.addColorStop(1, '#ef4444');
  ctx.fillStyle = grd;
  roundRect(ctx, x, y + h - fillH, w, fillH, 4);
  ctx.fill();
  ctx.restore();
}

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
