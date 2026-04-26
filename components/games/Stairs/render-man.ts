// 角色繪製 — 純 procedural,無圖片依賴。
//
// 直接複刻 NS-SHAFT 原版圖片的角色:
//   - 黑色頭髮 + 白色 hachimaki + 紅日點(右側下垂的綁帶尾)
//   - 黃色道服上衣 + 深色 V 型開襟 + 白色腰帶
//   - 白褲、棕色短靴
//   - 「黑豆」眼(單純黑色橢圓,不畫眼白)
//   - 明顯的橘紅色腮紅
//   - 一般的小嘴笑
//
// 比例(charW × charH = 40×40,角色填滿整個框,頭頂略凸出):
//   y -2..11   HAIR — 黑色頭髮,微微凸出框上製造蓬鬆感
//   y 11..16   HACHIMAKI — 白頭巾橫貫前額,中央紅日 + 右側綁帶
//   y 16..26   FACE — 黑豆眼 + 腮紅 + 嘴
//   y 26..34   BODY — 黃色道服 + V 領 + 白腰帶
//   y 34..38   PANTS — 白褲(走路時左右抬起)
//   y 38..40   BOOTS — 棕色短靴
//
// 兩套色板:NORMAL + HURT;受傷時 renderer 以 12Hz 切換。
// HURT 保留 hachimaki 白 + 紅日點,其他染紅 + X 眼 + O 嘴。

import { CFG, type Character } from './types';

type Palette = {
  skin: string;
  hair: string;
  hachimaki: string;
  hachimakiDot: string;
  shirt: string;
  vNeck: string;
  arm: string;
  sash: string;
  pants: string;
  shoe: string;
  outline: string;
  blush: string;
};

const NORMAL: Palette = {
  skin: '#f5cfa5',
  hair: '#0d0d0d',
  hachimaki: '#fdfdfd',
  hachimakiDot: '#dc2626',
  shirt: '#f5c11e',
  vNeck: '#0f172a',
  arm: '#caa410',
  sash: '#f5f5f5',
  pants: '#f5f5f5',
  shoe: '#7c2d12',
  outline: '#0f172a',
  blush: 'rgba(244, 114, 95, 0.55)',
};

const HURT: Palette = {
  skin: '#fecaca',
  hair: '#7f1d1d',
  hachimaki: '#fdfdfd',
  hachimakiDot: '#dc2626',
  shirt: '#dc2626',
  vNeck: '#450a0a',
  arm: '#991b1b',
  sash: '#fee2e2',
  pants: '#fee2e2',
  shoe: '#450a0a',
  outline: '#450a0a',
  blush: 'rgba(127, 29, 29, 0)',
};

export function drawMan(
  ctx: CanvasRenderingContext2D,
  c: Character,
  walkAnim: number,
  hurt: boolean,
): void {
  const p = hurt ? HURT : NORMAL;
  const cx = c.x;
  const cy = c.y;

  // 影子(放大配合更大的角色)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + CFG.charH - 0.5, 16, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // 走路相位
  const phase = c.state !== 0 ? Math.floor(walkAnim / 0.1) % 2 : -1;
  const legLLift = phase === 0 ? 4 : 0;
  const legRLift = phase === 1 ? 4 : 0;
  const armLDx = phase === 0 ? c.facing * 1.8 : phase === 1 ? -c.facing * 1.8 : 0;
  const armRDx = phase === 1 ? c.facing * 1.8 : phase === 0 ? -c.facing * 1.8 : 0;

  // === 由後往前畫 ===

  drawLeg(ctx, p, cx - 6, cy + 34, legLLift);
  drawLeg(ctx, p, cx + 2, cy + 34, legRLift);

  drawBody(ctx, p, cx, cy);

  // 手(緊貼身體兩側,走路時前後擺)
  drawArm(ctx, p, cx - 12 + armLDx, cy + 26);
  drawArm(ctx, p, cx + 9 + armRDx, cy + 26);

  drawHead(ctx, p, cx, cy);

  drawFace(ctx, p, cx, cy, c.facing, hurt);

  if (hurt) {
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 1;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('!', cx + 15, cy);
    ctx.fillText('!', cx + 15, cy);
  }
}

function drawHead(ctx: CanvasRenderingContext2D, p: Palette, cx: number, cy: number): void {
  // 1) 臉(膚色大圓 — 半徑加大到 13)
  ctx.fillStyle = p.skin;
  ctx.beginPath();
  ctx.arc(cx, cy + 13, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = p.outline;
  ctx.lineWidth = 0.9;
  ctx.stroke();

  // 2) 黑色頭髮(凸出框上,膨膨感)
  ctx.fillStyle = p.hair;
  ctx.beginPath();
  ctx.moveTo(cx - 13, cy + 11);
  ctx.lineTo(cx - 13.5, cy + 5);
  ctx.bezierCurveTo(cx - 14, cy - 1, cx - 7, cy - 2, cx, cy - 2);
  ctx.bezierCurveTo(cx + 7, cy - 2, cx + 14, cy - 1, cx + 13.5, cy + 5);
  ctx.lineTo(cx + 13, cy + 11);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = p.outline;
  ctx.lineWidth = 0.9;
  ctx.stroke();

  // 3) Hachimaki 白頭巾(配合更大的頭加寬)
  ctx.fillStyle = p.hachimaki;
  ctx.fillRect(cx - 13, cy + 11, 26, 4.5);
  ctx.strokeStyle = p.outline;
  ctx.lineWidth = 0.7;
  ctx.strokeRect(cx - 13, cy + 11, 26, 4.5);
  // 右側綁帶垂下(較長,凸顯)
  ctx.fillStyle = p.hachimaki;
  ctx.fillRect(cx + 9.5, cy + 15, 3, 7);
  ctx.strokeRect(cx + 9.5, cy + 15, 3, 7);
  // 紅日(放大)
  ctx.fillStyle = p.hachimakiDot;
  ctx.beginPath();
  ctx.arc(cx, cy + 13.2, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 0.6;
  ctx.stroke();
}

function drawBody(ctx: CanvasRenderingContext2D, p: Palette, cx: number, cy: number): void {
  // 黃色道服(加寬到 18)
  ctx.fillStyle = p.shirt;
  ctx.fillRect(cx - 9, cy + 26, 18, 8);

  // 深色 V 領開襟(三角形,加長)
  ctx.fillStyle = p.vNeck;
  ctx.beginPath();
  ctx.moveTo(cx - 4.5, cy + 26);
  ctx.lineTo(cx, cy + 31.5);
  ctx.lineTo(cx + 4.5, cy + 26);
  ctx.closePath();
  ctx.fill();

  // 道服外輪廓
  ctx.strokeStyle = p.outline;
  ctx.lineWidth = 0.9;
  ctx.strokeRect(cx - 9, cy + 26, 18, 8);

  // 白色腰帶
  ctx.fillStyle = p.sash;
  ctx.fillRect(cx - 9, cy + 32, 18, 2);
  ctx.strokeStyle = p.outline;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(cx - 9, cy + 32);
  ctx.lineTo(cx + 9, cy + 32);
  ctx.moveTo(cx - 9, cy + 34);
  ctx.lineTo(cx + 9, cy + 34);
  ctx.stroke();
}

function drawLeg(
  ctx: CanvasRenderingContext2D,
  p: Palette,
  x: number,
  y: number,
  liftOff: number,
): void {
  // 白褲(更大隻 — 4.5 wide,4 tall)
  ctx.fillStyle = p.pants;
  ctx.fillRect(x, y - liftOff, 4.5, 4);
  ctx.strokeStyle = p.outline;
  ctx.lineWidth = 0.7;
  ctx.strokeRect(x, y - liftOff, 4.5, 4);
  // 棕色短靴(7 wide,2.5 tall)
  ctx.fillStyle = p.shoe;
  ctx.fillRect(x - 1.2, y + 4 - liftOff, 7, 2.5);
  ctx.strokeRect(x - 1.2, y + 4 - liftOff, 7, 2.5);
}

function drawArm(ctx: CanvasRenderingContext2D, p: Palette, x: number, y: number): void {
  // 袖子(加粗到 3.5)
  ctx.fillStyle = p.arm;
  ctx.fillRect(x, y, 3.5, 8);
  ctx.strokeStyle = p.outline;
  ctx.lineWidth = 0.7;
  ctx.strokeRect(x, y, 3.5, 8);
  // 手(放大)
  ctx.fillStyle = p.skin;
  ctx.beginPath();
  ctx.arc(x + 1.75, y + 9.5, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawFace(
  ctx: CanvasRenderingContext2D,
  p: Palette,
  cx: number,
  cy: number,
  facing: -1 | 1,
  hurt: boolean,
): void {
  const eyeY = cy + 19.5;
  const off = facing * 0.5;

  if (hurt) {
    // X 眼(配合大頭加大)
    ctx.strokeStyle = p.outline;
    ctx.lineWidth = 1.7;
    for (const ex of [cx - 4.5 + off, cx + 4.5 + off]) {
      ctx.beginPath();
      ctx.moveTo(ex - 2.4, eyeY - 2.4);
      ctx.lineTo(ex + 2.4, eyeY + 2.4);
      ctx.moveTo(ex - 2.4, eyeY + 2.4);
      ctx.lineTo(ex + 2.4, eyeY - 2.4);
      ctx.stroke();
    }
    // O 嘴
    ctx.fillStyle = '#450a0a';
    ctx.beginPath();
    ctx.ellipse(cx + off, cy + 23.5, 2.3, 2.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.outline;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  } else {
    // 黑豆眼:純黑橢圓(大隻一點)
    ctx.fillStyle = '#0a0a0a';
    for (const ex of [cx - 4.5 + off, cx + 4.5 + off]) {
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, 1.6, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 醒目的橘紅色腮紅(放大)
    ctx.fillStyle = p.blush;
    ctx.beginPath();
    ctx.ellipse(cx - 8.5, cy + 22, 3, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 8.5, cy + 22, 3, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 微笑(加大)
    ctx.strokeStyle = p.outline;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx + off, cy + 24, 1.7, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
}
