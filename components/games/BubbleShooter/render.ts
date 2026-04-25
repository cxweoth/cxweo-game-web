// 泡泡龍 Canvas 繪圖

import { gridToPixel } from './logic';
import { CFG, COLOR_HEX, type Cell, type Color, type Flying, type Grid, type PopFx } from './types';

type DrawState = {
  grid: Grid;
  flying: Flying | null;
  currentColor: Color;
  nextColor: Color;
  aimDeg: number;
  popFx: ReadonlyArray<PopFx>;
  /** 累計時間(秒) — 給高光呼吸用 */
  time: number;
};

export function drawScene(ctx: CanvasRenderingContext2D, s: DrawState): void {
  ctx.clearRect(0, 0, CFG.width, CFG.height);
  drawBackground(ctx);
  drawLoseLine(ctx);
  drawGrid(ctx, s.grid);
  drawPopFx(ctx, s.popFx);
  if (!s.flying) drawAimLine(ctx, s.aimDeg, s.currentColor);
  if (s.flying) drawBubble(ctx, s.flying.x, s.flying.y, s.flying.color);
  drawShooter(ctx, s.aimDeg, s.currentColor, s.nextColor);
}

function drawBackground(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, 0, 0, CFG.height);
  g.addColorStop(0, '#1e1b4b');
  g.addColorStop(1, '#312e81');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CFG.width, CFG.height);
}

function drawLoseLine(ctx: CanvasRenderingContext2D): void {
  const y = CFG.loseRow * CFG.cellH + CFG.bubbleR + 4 - CFG.cellH / 2;
  ctx.save();
  ctx.strokeStyle = 'rgba(239,68,68,0.6)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 6]);
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(CFG.width, y);
  ctx.stroke();
  ctx.restore();
}

function drawGrid(ctx: CanvasRenderingContext2D, grid: Grid): void {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < CFG.cols; c++) {
      const cell = grid[r]?.[c] as Cell;
      if (!cell) continue;
      const p = gridToPixel(r, c);
      drawBubble(ctx, p.x, p.y, cell.color);
    }
  }
}

function drawBubble(ctx: CanvasRenderingContext2D, x: number, y: number, color: Color): void {
  const r = CFG.bubbleR;
  const grd = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  grd.addColorStop(0, '#ffffffcc');
  grd.addColorStop(0.4, COLOR_HEX[color]);
  grd.addColorStop(1, COLOR_HEX[color]);
  ctx.save();
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawPopFx(ctx: CanvasRenderingContext2D, fx: ReadonlyArray<PopFx>): void {
  ctx.save();
  for (const p of fx) {
    const t = p.age / p.ttl;
    const alpha = Math.max(0, 1 - t);
    const r = CFG.bubbleR * (1 + t * 0.6);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = COLOR_HEX[p.color];
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    // 中心高光
    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawAimLine(ctx: CanvasRenderingContext2D, aimDeg: number, color: Color): void {
  const a = (aimDeg * Math.PI) / 180;
  let x = CFG.shooterX;
  let y = CFG.shooterY - 30;
  let dx = Math.sin(a);
  let dy = -Math.cos(a);
  ctx.save();
  ctx.strokeStyle = `${COLOR_HEX[color]}aa`;
  ctx.lineWidth = 3;
  ctx.setLineDash([4, 8]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  // 模擬反彈最多 2 次
  let bounces = 0;
  while (bounces < 3) {
    // 找到下次撞牆 / 撞頂的距離
    const tLeft = dx < 0 ? (CFG.bubbleR - x) / dx : Infinity;
    const tRight = dx > 0 ? (CFG.width - CFG.bubbleR - x) / dx : Infinity;
    const tTop = dy < 0 ? (CFG.bubbleR - y) / dy : Infinity;
    const tWall = Math.min(tLeft, tRight);
    const tHit = Math.min(tWall, tTop);
    const stop = Math.min(tHit, 800); // 上限長度
    x += dx * stop;
    y += dy * stop;
    ctx.lineTo(x, y);
    if (stop >= 800 || tHit === tTop) break;
    // 反彈
    dx = -dx;
    bounces++;
  }
  ctx.stroke();
  ctx.restore();
}

function drawShooter(
  ctx: CanvasRenderingContext2D,
  aimDeg: number,
  current: Color,
  next: Color,
): void {
  const sx = CFG.shooterX;
  const sy = CFG.shooterY;
  ctx.save();
  // 底座
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 20, 36, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // 砲管
  const a = (aimDeg * Math.PI) / 180;
  ctx.translate(sx, sy);
  ctx.rotate(a);
  ctx.fillStyle = '#334155';
  ctx.fillRect(-7, -50, 14, 30);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-9, -56, 18, 6);
  ctx.restore();

  // 裝填的泡泡（在砲口附近）
  const muzzleX = sx + Math.sin(a) * 30;
  const muzzleY = sy - Math.cos(a) * 30;
  drawBubble(ctx, muzzleX, muzzleY, current);

  // 下一顆預覽（左下）
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = 'bold 11px ui-sans-serif, system-ui';
  ctx.textBaseline = 'top';
  ctx.fillText('下一顆', 12, CFG.shooterY - 30);
  ctx.restore();
  drawBubble(ctx, 60, CFG.shooterY - 8, next);
}
