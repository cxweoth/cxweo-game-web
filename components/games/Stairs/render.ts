// 下樓梯繪圖。

import { CFG, type Character, type Stair } from './types';

type DrawState = {
  char: Character;
  stairs: ReadonlyArray<Stair>;
  hp: number;
  score: number;
  best: number | null;
  /** 累計時間(秒),角色待機呼吸動畫 */
  time: number;
  /** 受擊紅閃終點(performance.now ms) */
  hurtFlashUntil: number;
  nowMs: number;
};

export function drawScene(ctx: CanvasRenderingContext2D, s: DrawState): void {
  ctx.clearRect(0, 0, CFG.width, CFG.height);
  drawBackground(ctx);
  drawCeiling(ctx, s.time);
  for (const stair of s.stairs) drawStair(ctx, stair);
  drawCharacter(ctx, s.char, s.time, s.char.invulnUntil > s.nowMs);
  if (s.hurtFlashUntil > s.nowMs) drawHurtFlash(ctx, s.hurtFlashUntil - s.nowMs);
  drawHUD(ctx, s.hp, s.score, s.best);
}

// --- 背景 ---

function drawBackground(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, 0, 0, CFG.height);
  g.addColorStop(0, '#0c1426');
  g.addColorStop(1, '#1f2937');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CFG.width, CFG.height);

  // 兩側石牆紋理（簡單磚塊）
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let r = 0; r < 60; r++) {
    const yy = (r * 24) % CFG.height;
    ctx.fillRect(0, yy, 30, 22);
    ctx.fillRect(CFG.width - 30, yy + 12, 30, 22);
  }
}

// --- 天花板（致命區） ---

function drawCeiling(ctx: CanvasRenderingContext2D, time: number): void {
  // 暗紅色帶 + 鋸齒下緣
  ctx.save();
  const grd = ctx.createLinearGradient(0, 0, 0, CFG.ceilingY);
  grd.addColorStop(0, '#7f1d1d');
  grd.addColorStop(1, '#dc2626');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, CFG.width, CFG.ceilingY);
  // 鋸齒
  ctx.beginPath();
  const teeth = 24;
  const tw = CFG.width / teeth;
  ctx.moveTo(0, CFG.ceilingY);
  for (let i = 0; i < teeth; i++) {
    ctx.lineTo(i * tw + tw / 2, CFG.ceilingY + 8);
    ctx.lineTo((i + 1) * tw, CFG.ceilingY);
  }
  ctx.lineTo(CFG.width, 0);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();
  // 警示閃光
  const pulse = (Math.sin(time * 4) + 1) / 2;
  ctx.fillStyle = `rgba(254,202,202,${0.15 + pulse * 0.15})`;
  ctx.fillRect(0, 0, CFG.width, CFG.ceilingY);
  ctx.restore();
}

// --- 樓梯 ---

function drawStair(ctx: CanvasRenderingContext2D, s: Stair): void {
  if (s.broken) return;
  ctx.save();
  ctx.translate(s.x, s.y);
  // 主體
  if (s.type === 'spike') {
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(0, 0, s.w, CFG.stairH);
    // 上方刺
    ctx.fillStyle = '#ef4444';
    const spikes = 8;
    const sw = s.w / spikes;
    ctx.beginPath();
    for (let i = 0; i < spikes; i++) {
      const x = i * sw;
      ctx.moveTo(x, 0);
      ctx.lineTo(x + sw / 2, -7);
      ctx.lineTo(x + sw, 0);
    }
    ctx.closePath();
    ctx.fill();
  } else if (s.type === 'fragile') {
    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(0, 0, s.w, CFG.stairH);
    // 裂痕
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const x = (i + 1) * (s.w / 4);
      ctx.beginPath();
      ctx.moveTo(x, 1);
      ctx.lineTo(x + 4, CFG.stairH - 1);
      ctx.stroke();
    }
  } else {
    // normal: 木紋
    const grd = ctx.createLinearGradient(0, 0, 0, CFG.stairH);
    grd.addColorStop(0, '#a16207');
    grd.addColorStop(1, '#713f12');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, s.w, CFG.stairH);
    // 上緣高光
    ctx.fillStyle = 'rgba(254,243,199,0.5)';
    ctx.fillRect(0, 0, s.w, 2);
  }
  // 邊框
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, s.w, CFG.stairH);
  ctx.restore();
}

// --- 角色 ---

function drawCharacter(
  ctx: CanvasRenderingContext2D,
  c: Character,
  time: number,
  invuln: boolean,
): void {
  const cx = c.x;
  const cy = c.y;
  const w = CFG.charW;
  const h = CFG.charH;
  ctx.save();
  // 無敵閃爍
  if (invuln) {
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 30);
  }
  // 影子
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + h, w * 0.45, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // 軀幹
  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(cx - w / 2 + 4, cy + 12, w - 8, h - 18);
  // 頭
  ctx.fillStyle = '#fcd9b6';
  ctx.beginPath();
  ctx.arc(cx, cy + 8, 9, 0, Math.PI * 2);
  ctx.fill();
  // 帽子
  ctx.fillStyle = '#7c2d12';
  ctx.beginPath();
  ctx.arc(cx, cy + 8, 10, Math.PI, 0);
  ctx.lineTo(cx + 8, cy + 4);
  ctx.lineTo(cx - 8, cy + 4);
  ctx.closePath();
  ctx.fill();
  // 雙腿
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(cx - 8, cy + h - 6, 5, 6);
  ctx.fillRect(cx + 3, cy + h - 6, 5, 6);
  ctx.restore();
}

// --- 受擊全螢幕紅閃 ---

function drawHurtFlash(ctx: CanvasRenderingContext2D, remainingMs: number): void {
  const alpha = Math.min(0.45, remainingMs / 600);
  ctx.save();
  const g = ctx.createRadialGradient(
    CFG.width / 2,
    CFG.height / 2,
    CFG.height / 3,
    CFG.width / 2,
    CFG.height / 2,
    CFG.width,
  );
  g.addColorStop(0, 'rgba(239,68,68,0)');
  g.addColorStop(1, `rgba(239,68,68,${alpha})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CFG.width, CFG.height);
  ctx.restore();
}

// --- HUD ---

function drawHUD(
  ctx: CanvasRenderingContext2D,
  hp: number,
  score: number,
  best: number | null,
): void {
  // 分數中央上方
  ctx.save();
  ctx.font = 'bold 20px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.fillStyle = '#fff';
  ctx.strokeText(`分數 ${score}`, CFG.width / 2, 4);
  ctx.fillText(`分數 ${score}`, CFG.width / 2, 4);
  if (best !== null) {
    ctx.font = '12px ui-sans-serif, system-ui, sans-serif';
    ctx.strokeText(`最佳 ${best}`, CFG.width / 2, 28);
    ctx.fillText(`最佳 ${best}`, CFG.width / 2, 28);
  }
  ctx.restore();
  // HP 左上
  drawHearts(ctx, hp);
}

function drawHearts(ctx: CanvasRenderingContext2D, hp: number): void {
  const total = CFG.maxHP;
  const size = 18;
  const gap = 5;
  for (let i = 0; i < total; i++) {
    const cx = 14 + i * (size + gap) + size / 2;
    const cy = 14 + size / 2;
    drawHeart(ctx, cx, cy, size, i < hp ? '#ef4444' : 'rgba(255,255,255,0.25)');
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
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
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
