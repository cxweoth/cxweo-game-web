// 玩家騎士繪製(藍衣 + 金髮 + 劍)
//
// 全 procedural,以「腳底中心」為原點。揮劍時劍以右肩為樞紐旋轉,
// hit window 階段再畫一條白色弧光提示判定範圍。

import { CFG, type PlayerState } from './types';
import { RAD } from './render-utils';

export function drawKnight(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  nowMs: number,
): void {
  const flashing = nowMs < player.flashUntil;
  const invul = nowMs < player.invulUntil;

  // 跳到空中時的腳底陰影(地面上)
  if (!player.grounded) {
    const heightAboveGround = -player.y; // 0 ~ ~80
    const t = Math.min(1, heightAboveGround / 100);
    ctx.save();
    ctx.fillStyle = `rgba(15,23,42,${0.32 * (1 - t * 0.6)})`;
    ctx.beginPath();
    ctx.ellipse(player.x, CFG.ground - 1, 16 - t * 6, 4 - t * 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // 站著也畫一個淡淡的腳影
    ctx.save();
    ctx.fillStyle = 'rgba(15,23,42,0.28)';
    ctx.beginPath();
    ctx.ellipse(player.x, CFG.ground - 1, 14, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  // y 為負時往上偏移 — 跳到空中
  ctx.translate(player.x, CFG.ground + player.y);
  ctx.scale(player.facing, 1);
  if (invul && Math.floor(nowMs / 90) % 2 === 0) ctx.globalAlpha = 0.45;

  // 腿
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(-6, -22, 5, 22);
  ctx.fillRect(1, -22, 5, 22);
  // 靴
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-7, -3, 7, 4);
  ctx.fillRect(0, -3, 7, 4);

  // 身體
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(-10, -42, 20, 22);
  ctx.fillStyle = '#60a5fa';
  ctx.fillRect(-10, -42, 20, 4);
  // 腰帶
  ctx.fillStyle = '#7c2d12';
  ctx.fillRect(-10, -22, 20, 3);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-2, -23, 4, 4);

  // 頭
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(0, -52, 9, 0, Math.PI * 2);
  ctx.fill();
  // 金髮
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(0, -55, 9.5, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-9.5, -55, 19, 2);

  // 眼睛 / 嘴
  ctx.fillStyle = '#0f172a';
  if (flashing) {
    ctx.fillRect(-5.5, -53, 4, 1.5);
    ctx.fillRect(1.5, -53, 4, 1.5);
  } else {
    ctx.beginPath();
    ctx.arc(-3.5, -52, 1.5, 0, Math.PI * 2);
    ctx.arc(3.5, -52, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-2, -47);
  ctx.lineTo(2, -47);
  ctx.stroke();

  if (flashing) {
    ctx.fillStyle = 'rgba(220,38,38,0.5)';
    ctx.fillRect(-12, -62, 24, 60);
  }

  drawKnightSword(ctx, player);

  ctx.restore();
}

function drawKnightSword(ctx: CanvasRenderingContext2D, player: PlayerState): void {
  // idle 是「劍立起來」的姿態(劍尖朝上偏前 15 度)。
  // anticipation 拉到 -150°(整個劍往後揚到頭後),hit 一路劈到 +35°(身前斜下),
  // recover 回 idle。
  const idle = -75 * RAD;
  const aim = -150 * RAD;
  const swung = 35 * RAD;
  let angle = idle;
  if (player.swingT > 0) {
    const e = CFG.playerSwingDur - player.swingT;
    const t1 = CFG.playerHitFrom;
    const t2 = CFG.playerHitTo;
    if (e < t1) {
      const k = e / t1;
      angle = idle + k * (aim - idle);
    } else if (e < t2) {
      const k = (e - t1) / (t2 - t1);
      angle = aim + k * (swung - aim);
    } else {
      const k = Math.min(1, (e - t2) / (CFG.playerSwingDur - t2));
      angle = swung + k * (idle - swung);
    }
  }
  ctx.save();
  ctx.translate(7, -36);
  ctx.rotate(angle);
  // 護手
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-5, -2, 12, 4);
  // 把手
  ctx.fillStyle = '#7c2d12';
  ctx.fillRect(-2, -12, 4, 10);
  ctx.fillStyle = '#a16207';
  ctx.fillRect(-1, -12, 1, 10);
  // 刀身
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(-1.5, 2, 3, 36);
  ctx.fillStyle = '#fff';
  ctx.fillRect(-0.3, 2, 1, 34);
  // 劍尖
  ctx.fillStyle = '#e5e7eb';
  ctx.beginPath();
  ctx.moveTo(-1.5, 38);
  ctx.lineTo(1.5, 38);
  ctx.lineTo(0, 44);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 揮劍弧光(命中窗階段;雙層 — 內層白、外層藍)
  if (player.swingT > 0) {
    const e = CFG.playerSwingDur - player.swingT;
    if (e >= CFG.playerHitFrom && e <= CFG.playerHitTo) {
      const prog = (e - CFG.playerHitFrom) / (CFG.playerHitTo - CFG.playerHitFrom);
      const startA = -150 * RAD;
      const endA = startA + prog * (35 * RAD - -150 * RAD);
      ctx.save();
      ctx.translate(7, -36);
      // 外層光暈
      ctx.strokeStyle = `rgba(96,165,250,${0.8 * (1 - prog)})`;
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, 40, startA, endA);
      ctx.stroke();
      // 內層白色
      ctx.strokeStyle = `rgba(255,255,255,${1 - prog * 0.7})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, 40, startA, endA);
      ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.restore();
    }
  }
}
