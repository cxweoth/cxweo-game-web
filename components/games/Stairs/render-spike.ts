// 尖刺階 — 拆成「基座」+「尖刺」兩層繪製,
//   基座畫在角色之前(角色踩在上面),
//   尖刺畫在角色之後(在 render.ts 第三趟 pass 呼叫),
// 結果就是「踩到時尖刺穿過身體」的視覺效果。

import { CFG, type Stair } from './types';

/** 尖刺基座:深色金屬平台 + 鉚釘;角色實際碰撞的部分。 */
export function drawSpikeBase(ctx: CanvasRenderingContext2D, s: Stair): void {
  const w = CFG.stairW;
  const h = CFG.stairH;
  const grd = ctx.createLinearGradient(0, s.y, 0, s.y + h);
  grd.addColorStop(0, '#475569');
  grd.addColorStop(0.5, '#334155');
  grd.addColorStop(1, '#1e293b');
  ctx.fillStyle = grd;
  ctx.fillRect(s.x, s.y, w, h);

  // 上邊緣亮邊
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(s.x, s.y + 0.5);
  ctx.lineTo(s.x + w, s.y + 0.5);
  ctx.stroke();

  // 四角鉚釘
  ctx.fillStyle = '#cbd5e1';
  for (const cx of [s.x + 5, s.x + w - 5]) {
    for (const cy of [s.y + 4, s.y + h - 4]) {
      ctx.beginPath();
      ctx.arc(cx, cy, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 邊框
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(s.x + 0.5, s.y + 0.5, w - 1, h - 1);
}

/** 尖刺尖端:從基座頂端往上長出三角刺,畫在角色之後 → 角色被刺穿。
 *  每一根刺左半暗、右半亮,模擬側光金屬感。 */
export function drawSpikeTips(ctx: CanvasRenderingContext2D, s: Stair): void {
  const baseY = s.y + 1; // 從基座頂端再往下 1px,避免與基座之間出現縫
  const tipY = s.y - CFG.spikeTipHeight;
  const totalW = CFG.stairW - 4;
  const spacing = totalW / CFG.spikeCount;
  for (let i = 0; i < CFG.spikeCount; i++) {
    const cx = s.x + 2 + spacing * (i + 0.5);
    const halfW = spacing * 0.46;

    // 左半暗面
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(cx - halfW, baseY);
    ctx.lineTo(cx, tipY);
    ctx.lineTo(cx, baseY);
    ctx.closePath();
    ctx.fill();

    // 右半亮面
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    ctx.lineTo(cx, tipY);
    ctx.lineTo(cx + halfW, baseY);
    ctx.closePath();
    ctx.fill();

    // 輪廓
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx - halfW, baseY);
    ctx.lineTo(cx, tipY);
    ctx.lineTo(cx + halfW, baseY);
    ctx.stroke();
  }
}
