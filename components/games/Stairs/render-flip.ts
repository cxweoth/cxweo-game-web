// 翻轉階(trapdoor)— 被踩到後繞長軸旋轉 180°,
// 上面看到木板 + 骷髏警告(視覺暗示「踩了會翻」),
// 翻過去後看到紅黑齒輪 + 黃黑警示斜紋(機關感)。
//
// 動畫機制:scaleY = cos(progress * π);scaleY > 0 顯示上面,< 0 顯示下面。
// 兩端的鉸鏈軸不參與縮放(鉸鏈是固定在世界座標的轉軸,板子才會旋轉)。

import { CFG, type Stair } from './types';

export function drawFlip(
  ctx: CanvasRenderingContext2D,
  s: Stair,
  elapsedSec: number,
): void {
  let progress = 0;
  if (s.triggeredAtSec !== undefined) {
    progress = Math.min(1, (elapsedSec - s.triggeredAtSec) / CFG.flipDurationSec);
  }
  if (progress >= 1) return;

  const angle = progress * Math.PI;
  const scaleY = Math.cos(angle);
  const showTop = scaleY > 0;
  const absScale = Math.max(0.04, Math.abs(scaleY));

  // 板子本體:scale Y 模擬繞長軸旋轉(類似翻牌效果)
  ctx.save();
  ctx.translate(s.x + CFG.stairW / 2, s.y + CFG.stairH / 2);
  ctx.scale(1, absScale);
  ctx.translate(-CFG.stairW / 2, -CFG.stairH / 2);
  if (showTop) drawFlipTopFace(ctx);
  else drawFlipBottomFace(ctx);
  ctx.restore();

  // 鉸鏈轉軸:固定在世界座標,不隨板子縮放(整段動畫都看得到軸還在)
  drawFlipAxles(ctx, s);
}

/** 上面:木板 + 骷髏 — 玩家第一眼就該察覺「這塊不對勁」 */
function drawFlipTopFace(ctx: CanvasRenderingContext2D): void {
  const w = CFG.stairW;
  const h = CFG.stairH;

  // 木板底色(三段漸層加深感)
  const grd = ctx.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, '#a16207');
  grd.addColorStop(0.5, '#854d0e');
  grd.addColorStop(1, '#713f12');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);

  // 木紋(用 sin 波讓線不死板)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.lineWidth = 0.8;
  for (let i = 1; i < 5; i++) {
    const baseY = (h / 5) * i;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 6) {
      const y = baseY + Math.sin(x * 0.07 + i * 1.5) * 1.4;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // 中央木板接縫
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w / 2, 3);
  ctx.lineTo(w / 2, h - 3);
  ctx.stroke();

  // 四角金屬鉚釘加固
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 0.8;
  for (const [cx, cy] of [
    [7, 6],
    [w - 7, 6],
    [7, h - 6],
    [w - 7, h - 6],
  ] as const) {
    ctx.fillStyle = '#52525b';
    ctx.beginPath();
    ctx.arc(cx, cy, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 中央雙骷髏標誌(警告)
  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 18px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('☠', w / 2 - 26, h / 2 + 1);
  ctx.fillText('☠', w / 2 + 26, h / 2 + 1);

  // 邊框(深色)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
}

/** 下面:黃黑斜紋警示帶 + 中央齒輪 — 機關面,翻過來就掉下去了 */
function drawFlipBottomFace(ctx: CanvasRenderingContext2D): void {
  const w = CFG.stairW;
  const h = CFG.stairH;

  // 底色(深色金屬)
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(0, 0, w, h);

  // 黃黑斜紋(clip 在矩形內)
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();
  ctx.fillStyle = '#fbbf24';
  const stripeW = 14;
  for (let x = -h; x < w + h; x += stripeW * 2) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + stripeW, 0);
    ctx.lineTo(x + stripeW + h, h);
    ctx.lineTo(x + h, h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 中央齒輪(機關感)
  const gx = w / 2;
  const gy = h / 2;
  ctx.fillStyle = '#3f3f46';
  ctx.beginPath();
  ctx.arc(gx, gy, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a1a1aa';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(gx + Math.cos(a) * 3.5, gy + Math.sin(a) * 3.5);
    ctx.lineTo(gx + Math.cos(a) * 8, gy + Math.sin(a) * 8);
    ctx.stroke();
  }
  ctx.fillStyle = '#71717a';
  ctx.beginPath();
  ctx.arc(gx, gy, 1.6, 0, Math.PI * 2);
  ctx.fill();

  // 邊框
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
}

/** 兩端的鉸鏈轉軸:深色軸座 + 金屬軸面 + 軸心,固定大小 */
function drawFlipAxles(ctx: CanvasRenderingContext2D, s: Stair): void {
  const cy = s.y + CFG.stairH / 2;
  for (const cx of [s.x + 5, s.x + CFG.stairW - 5]) {
    // 軸座(深色)
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    // 金屬軸面
    ctx.fillStyle = '#a1a1aa';
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // 軸心(深色點)
    ctx.fillStyle = '#3f3f46';
    ctx.beginPath();
    ctx.arc(cx, cy, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}
