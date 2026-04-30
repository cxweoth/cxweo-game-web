// Canvas 繪圖層:純函式,讀 World 畫圖。不修改 World(popup 老化在 SnakeCanvas)。

import { CFG } from './types';
import type { World } from './game';

export function drawScene(
  ctx: CanvasRenderingContext2D,
  world: World,
  nowMs: number,
): void {
  ctx.save();
  // 死亡瞬間螢幕震動
  if (nowMs < world.screenShakeUntil) {
    const remain = (world.screenShakeUntil - nowMs) / 320;
    const mag = remain * 6;
    ctx.translate(
      (Math.random() - 0.5) * 2 * mag,
      (Math.random() - 0.5) * 2 * mag,
    );
  }
  drawBackground(ctx);
  drawFood(ctx, world, nowMs);
  drawSnake(ctx, world, nowMs);
  drawPopups(ctx, world);
  ctx.restore();
}

function drawBackground(ctx: CanvasRenderingContext2D): void {
  // 底色:深 slate;偶數 + 奇數格交錯一格用稍亮色,做出棋盤紋
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, CFG.width, CFG.height);
  ctx.fillStyle = '#1e293b';
  for (let y = 0; y < CFG.gridH; y++) {
    for (let x = 0; x < CFG.gridW; x++) {
      if ((x + y) % 2 === 0) {
        ctx.fillRect(x * CFG.cellPx, y * CFG.cellPx, CFG.cellPx, CFG.cellPx);
      }
    }
  }
  // 邊框微光,讓場地視覺收邊
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, CFG.width - 2, CFG.height - 2);
}

function drawFood(
  ctx: CanvasRenderingContext2D,
  world: World,
  nowMs: number,
): void {
  const cx = world.food.x * CFG.cellPx + CFG.cellPx / 2;
  const cy = world.food.y * CFG.cellPx + CFG.cellPx / 2;
  // 呼吸脈衝:0.92 → 1.08
  const breath = 1 + Math.sin(nowMs / 250) * 0.08;
  const r = CFG.cellPx * 0.36 * breath;

  // 蘋果本體
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(cx, cy + 1, r, 0, Math.PI * 2);
  ctx.fill();
  // 葉子
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.ellipse(cx + 3, cy - r * 0.85, 4, 2.4, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // 高光
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
}

function drawSnake(
  ctx: CanvasRenderingContext2D,
  world: World,
  nowMs: number,
): void {
  // step 之間的插值進度;尚未開始計時則 0
  const progress =
    world.lastStepAt === 0
      ? 0
      : Math.min(1, (nowMs - world.lastStepAt) / world.stepInterval);

  const N = world.cells.length;
  // 從尾向頭畫,讓頭蓋在最上層;眼睛才不會被身體覆蓋。
  for (let i = N - 1; i >= 0; i--) {
    const cur = world.cells[i]!;
    const prev = world.prevCells[i] ?? cur;
    const x =
      (prev.x + (cur.x - prev.x) * progress) * CFG.cellPx + CFG.cellPx / 2;
    const y =
      (prev.y + (cur.y - prev.y) * progress) * CFG.cellPx + CFG.cellPx / 2;
    drawSegment(ctx, x, y, i === 0, i, N, world, nowMs);
  }
}

function drawSegment(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isHead: boolean,
  idx: number,
  total: number,
  world: World,
  nowMs: number,
): void {
  const r = CFG.cellPx * 0.42;
  // 頭最亮,身體往尾漸暗:lightness 60% → 35%
  const t = total <= 1 ? 0 : idx / (total - 1);
  const lightness = 60 - t * 25;
  ctx.fillStyle = isHead ? '#86efac' : `hsl(140, 60%, ${lightness}%)`;
  roundRect(ctx, x - r, y - r, r * 2, r * 2, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  if (!isHead) return;

  // 蛇頭眼睛:相對方向左右各一點。dx/dy 是「往前」單位向量;
  // 「左右」用 (−dy, dx) 旋轉 90°。
  const fx = world.dir.dx;
  const fy = world.dir.dy;
  const sxL = x + fx * 4 + -fy * 5;
  const syL = y + fy * 4 + fx * 5;
  const sxR = x + fx * 4 + fy * 5;
  const syR = y + fy * 4 + -fx * 5;
  drawEye(ctx, sxL, syL);
  drawEye(ctx, sxR, syR);

  // 吃到食物的脈衝環
  if (nowMs < world.headPulseUntil) {
    const remain = (world.headPulseUntil - nowMs) / 250;
    ctx.strokeStyle = `rgba(250, 204, 21, ${(remain * 0.85).toFixed(3)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r + (1 - remain) * 8, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
): void {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(x, y, 1.2, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawPopups(ctx: CanvasRenderingContext2D, world: World): void {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 18px ui-monospace, monospace';
  for (const p of world.popups) {
    const a = 1 - p.age / p.ttl;
    if (a <= 0) continue;
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;
}
