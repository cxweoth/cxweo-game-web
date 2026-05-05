// 背景:傍晚天空 + 三層遠山 + 中景樹剪影 + 前景草地細節
//
// 全 procedural,目標是不靠任何素材就有「結束日落 + 騎士史詩決戰」的氛圍。

import { CFG } from './types';

export function drawBackground(ctx: CanvasRenderingContext2D, time: number): void {
  drawSky(ctx);
  drawSun(ctx, time);
  drawClouds(ctx, time);
  drawFarMountains(ctx);
  drawMidMountains(ctx);
  drawNearMountains(ctx);
  drawTreeline(ctx);
  drawGround(ctx);
  drawForeground(ctx, time);
}

function drawSky(ctx: CanvasRenderingContext2D): void {
  const sky = ctx.createLinearGradient(0, 0, 0, CFG.ground);
  // 由上往下:深紫藍 → 粉橘 → 金黃(地平線)
  sky.addColorStop(0, '#312e81');
  sky.addColorStop(0.35, '#7c3aed');
  sky.addColorStop(0.65, '#f97316');
  sky.addColorStop(1, '#fbbf24');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CFG.width, CFG.ground);
}

function drawSun(ctx: CanvasRenderingContext2D, time: number): void {
  const cx = 600;
  const cy = 200;
  // 多層光暈
  for (let i = 4; i >= 1; i--) {
    ctx.save();
    ctx.globalAlpha = 0.13;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(cx, cy, 45 + i * 22 + Math.sin(time * 0.6 + i) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // 太陽本體(雙圈漸層感)
  const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, 50);
  grad.addColorStop(0, '#fffbeb');
  grad.addColorStop(0.5, '#fde68a');
  grad.addColorStop(1, '#f59e0b');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 50, 0, Math.PI * 2);
  ctx.fill();
}

function drawClouds(ctx: CanvasRenderingContext2D, time: number): void {
  // 三層雲(深、中、淺)以不同速度漂浮
  drawCloud(ctx, ((time * 8) % (CFG.width + 200)) - 100, 60, 0.55, 'rgba(196,181,253,0.85)', 1.4);
  drawCloud(ctx, ((time * 14 + 220) % (CFG.width + 200)) - 100, 100, 0.65, 'rgba(253,164,175,0.8)', 1);
  drawCloud(ctx, ((time * 18 + 480) % (CFG.width + 200)) - 100, 140, 0.7, 'rgba(254,215,170,0.85)', 0.8);
  drawCloud(ctx, ((time * 11 + 700) % (CFG.width + 200)) - 100, 80, 0.6, 'rgba(221,214,254,0.7)', 1.2);
}

function drawCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  alpha: number,
  color: string,
  scale: number,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 18 * scale, 0, Math.PI * 2);
  ctx.arc(x + 18 * scale, y - 6 * scale, 22 * scale, 0, Math.PI * 2);
  ctx.arc(x + 38 * scale, y, 20 * scale, 0, Math.PI * 2);
  ctx.arc(x + 58 * scale, y + 4 * scale, 16 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFarMountains(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#5b21b6';
  ctx.globalAlpha = 0.65;
  drawMountainRange(ctx, [
    [-40, 320],
    [80, 270],
    [200, 250],
    [310, 280],
    [430, 240],
    [560, 250],
    [700, 210],
    [840, 280],
  ]);
  ctx.globalAlpha = 1;
}

function drawMidMountains(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#4c1d95';
  drawMountainRange(ctx, [
    [-40, 340],
    [120, 290],
    [240, 320],
    [360, 300],
    [500, 330],
    [620, 280],
    [760, 320],
    [840, 330],
  ]);
}

function drawNearMountains(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#1e1b4b';
  drawMountainRange(ctx, [
    [-40, 360],
    [60, 340],
    [180, 350],
    [300, 330],
    [430, 348],
    [560, 332],
    [680, 348],
    [840, 360],
  ]);
}

function drawMountainRange(ctx: CanvasRenderingContext2D, peaks: Array<[number, number]>): void {
  ctx.beginPath();
  ctx.moveTo(0, CFG.ground);
  for (const [x, y] of peaks) ctx.lineTo(x, y);
  ctx.lineTo(CFG.width, CFG.ground);
  ctx.closePath();
  ctx.fill();
}

function drawTreeline(ctx: CanvasRenderingContext2D): void {
  // 中景樹剪影 — 散布在 mountain 與 ground 之間
  const trees: Array<[number, number, number]> = [
    [50, 360, 22],
    [120, 358, 18],
    [185, 362, 26],
    [260, 360, 20],
    [340, 362, 24],
    [430, 358, 19],
    [505, 362, 22],
    [580, 360, 18],
    [660, 362, 25],
    [735, 360, 20],
    [790, 362, 22],
  ];
  for (const [x, baseY, h] of trees) drawTree(ctx, x, baseY, h);
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, baseY: number, h: number): void {
  // 三角樹形 + 樹幹
  ctx.fillStyle = '#1e1b4b';
  // 樹幹
  ctx.fillRect(x - 1.2, baseY - 4, 2.4, 4);
  // 樹葉(多層三角)
  ctx.beginPath();
  ctx.moveTo(x - h * 0.4, baseY - 4);
  ctx.lineTo(x + h * 0.4, baseY - 4);
  ctx.lineTo(x, baseY - h);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - h * 0.32, baseY - h * 0.4);
  ctx.lineTo(x + h * 0.32, baseY - h * 0.4);
  ctx.lineTo(x, baseY - h * 1.05);
  ctx.closePath();
  ctx.fill();
}

function drawGround(ctx: CanvasRenderingContext2D): void {
  // 草地漸層
  const grnd = ctx.createLinearGradient(0, CFG.ground, 0, CFG.height);
  grnd.addColorStop(0, '#65a30d');
  grnd.addColorStop(0.4, '#4d7c0f');
  grnd.addColorStop(1, '#1a2e05');
  ctx.fillStyle = grnd;
  ctx.fillRect(0, CFG.ground, CFG.width, CFG.height - CFG.ground);

  // 地平線高光
  ctx.fillStyle = 'rgba(190,242,100,0.7)';
  ctx.fillRect(0, CFG.ground - 2, CFG.width, 3);
  // 第二層高光(浪一點的綠線)
  ctx.fillStyle = 'rgba(132,204,22,0.4)';
  for (let x = 0; x < CFG.width; x += 6) {
    const y = CFG.ground + 2 + Math.sin(x * 0.04) * 1.2;
    ctx.fillRect(x, y, 4, 1);
  }
}

function drawForeground(ctx: CanvasRenderingContext2D, time: number): void {
  // 前景小草 + 小花 — 散佈在地面上,風吹擺動
  const tufts: Array<[number, string]> = [
    [60, '#84cc16'],
    [110, '#65a30d'],
    [170, '#84cc16'],
    [240, '#65a30d'],
    [300, '#84cc16'],
    [380, '#65a30d'],
    [460, '#84cc16'],
    [540, '#65a30d'],
    [620, '#84cc16'],
    [700, '#65a30d'],
    [760, '#84cc16'],
  ];
  for (const [x, col] of tufts) {
    drawGrassTuft(ctx, x, CFG.ground - 2, col, time);
  }
  const flowers: Array<[number, string]> = [
    [85, '#f43f5e'],
    [200, '#fbbf24'],
    [330, '#a855f7'],
    [510, '#f43f5e'],
    [660, '#fbbf24'],
    [780, '#a855f7'],
  ];
  for (const [x, col] of flowers) drawFlower(ctx, x, CFG.ground - 2, col, time);
  // 前景小石頭
  drawRock(ctx, 145, CFG.ground + 12, 12);
  drawRock(ctx, 410, CFG.ground + 16, 14);
  drawRock(ctx, 720, CFG.ground + 14, 10);
}

function drawGrassTuft(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  time: number,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  for (let i = -3; i <= 3; i++) {
    const sway = Math.sin(time * 1.6 + x * 0.05 + i) * 1.4;
    ctx.beginPath();
    ctx.moveTo(x + i * 1.6, y);
    ctx.lineTo(x + i * 1.6 + sway, y - 5 - Math.abs(i));
    ctx.stroke();
  }
}

function drawFlower(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  time: number,
): void {
  const sway = Math.sin(time * 1.3 + x * 0.05) * 1;
  ctx.strokeStyle = '#65a30d';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + sway, y - 8);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + sway, y - 9, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fefce8';
  ctx.beginPath();
  ctx.arc(x + sway, y - 9, 0.9, 0, Math.PI * 2);
  ctx.fill();
}

function drawRock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  ctx.fillStyle = '#3f3f46';
  ctx.beginPath();
  ctx.ellipse(x, y, w, w * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#52525b';
  ctx.beginPath();
  ctx.ellipse(x - w * 0.2, y - w * 0.2, w * 0.5, w * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
}
