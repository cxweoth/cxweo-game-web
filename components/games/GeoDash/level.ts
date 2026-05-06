// 關卡資料 + 無盡模式 procedural generator
//
// 手工關卡:致敬 Stereo Madness 的 60 秒短關。所有 x 都是「世界座標」。
// 跳躍寬度 = 760² / (2*2200) = 131px 高、滯空時間 0.69s × 360px/s = 248px 寬。
// 所以連跳之間至少要間隔 ~ 250px。
//
// 無盡模式:依玩家走的距離動態生成下一段障礙;難度漸增。

import { CFG, type Obstacle } from './types';

const T = CFG.tile; // 30

/** 手工關 — Stereo Madness 風格,60 秒約 21600px。 */
export const HAND_LEVEL: ReadonlyArray<Obstacle> = [
  // 0 - 2400 (0~7s):全空地,熟悉控制
  // 2400 - 5400:單尖刺零散
  { kind: 'spike', x: 2400 },
  { kind: 'spike', x: 3300 },
  { kind: 'spike', x: 4100 },
  { kind: 'spike', x: 5000 },

  // 5400 - 8400:尖刺 + 方塊堆,跳到方塊上避免地面尖刺
  { kind: 'block', x: 5700, w: T * 3, h: T },
  { kind: 'spike', x: 5760 },
  { kind: 'spike', x: 5790 },
  { kind: 'spike', x: 5820 },
  { kind: 'spike', x: 6500 },
  { kind: 'block', x: 7100, w: T * 2, h: T * 2 },
  { kind: 'block', x: 7100 + T * 2, w: T * 2, h: T },
  { kind: 'spike', x: 7700 },

  // 8400 - 11400:雙連尖刺 + 平台跳
  { kind: 'spike', x: 8500 },
  { kind: 'spike', x: 8530 },
  { kind: 'spike', x: 9300 },
  { kind: 'spike', x: 9330 },
  { kind: 'spike', x: 9360 },
  { kind: 'block', x: 10000, w: T * 4, h: T * 2 },
  { kind: 'spike', x: 10300 },
  { kind: 'spike', x: 10800 },
  { kind: 'block', x: 11000, w: T * 2, h: T },
  { kind: 'spike', x: 11200 },

  // 11400 - 14400:三連跳 + 高方塊
  { kind: 'block', x: 11900, w: T * 2, h: T * 3 },
  { kind: 'block', x: 11900 + T * 2, w: T * 2, h: T },
  { kind: 'spike', x: 12500 },
  { kind: 'spike', x: 12530 },
  { kind: 'spike', x: 12560 },
  { kind: 'spike', x: 13100 },
  { kind: 'spike', x: 13130 },
  { kind: 'block', x: 13700, w: T * 3, h: T * 2 },
  { kind: 'spike', x: 13800 },
  { kind: 'spike', x: 13830 },
  { kind: 'spike', x: 13860 },

  // 14400 - 17400:極限段
  { kind: 'spike', x: 14600 },
  { kind: 'spike', x: 14630 },
  { kind: 'spike', x: 14660 },
  { kind: 'spike', x: 14690 },
  { kind: 'block', x: 15200, w: T * 2, h: T * 2 },
  { kind: 'block', x: 15500, w: T * 2, h: T * 2 },
  { kind: 'spike', x: 16000 },
  { kind: 'spike', x: 16030 },
  { kind: 'block', x: 16400, w: T * 4, h: T * 3 },
  { kind: 'spike', x: 16500 },
  { kind: 'spike', x: 16530 },
  { kind: 'spike', x: 16560 },
  { kind: 'spike', x: 16590 },

  // 17400 - 20400:緩和段
  { kind: 'spike', x: 17600 },
  { kind: 'spike', x: 18200 },
  { kind: 'block', x: 18700, w: T * 3, h: T },
  { kind: 'spike', x: 19400 },
  { kind: 'spike', x: 20000 },

  // 20400 - 21600:終點前
  { kind: 'spike', x: 20700 },
  { kind: 'spike', x: 21000 },
];

export const LEVEL_END_X = 21600;

/**
 * 無盡模式:依目前世界位置 x 與已生成的最大 x 決定要不要 spawn 新障礙。
 * 每次回傳 0~N 個新障礙,並更新 nextX 指標。
 *
 * 難度曲線:
 *   distance < 2000     → 純空地暖身
 *   2000 ~ 6000         → 單尖刺,間距 600~900
 *   6000 ~ 12000        → 雙連尖刺 + 偶爾方塊
 *   12000 ~ 20000       → 三連尖刺、高方塊組合
 *   20000+              → 全力,最短間距 350
 */
export function endlessNextChunk(
  alreadyMaxX: number,
): { obstacles: Obstacle[]; nextMaxX: number } {
  const obstacles: Obstacle[] = [];
  let cursor = alreadyMaxX;
  // 每次 batch 生成大約 1500 px 的內容
  const targetX = alreadyMaxX + 1500;

  while (cursor < targetX) {
    const dist = cursor;
    const r = Math.random();

    // 暖身段
    if (dist < 2000) {
      cursor += 600 + Math.random() * 400;
      continue;
    }

    if (dist < 6000) {
      const gap = 600 + Math.random() * 300;
      obstacles.push({ kind: 'spike', x: cursor + gap });
      cursor += gap + 60;
    } else if (dist < 12000) {
      const gap = 500 + Math.random() * 300;
      if (r < 0.55) {
        // 雙連尖刺
        obstacles.push({ kind: 'spike', x: cursor + gap });
        obstacles.push({ kind: 'spike', x: cursor + gap + T });
        cursor += gap + T * 2 + 40;
      } else if (r < 0.85) {
        // 方塊 + 後跟尖刺
        const w = (1 + Math.floor(Math.random() * 3)) * T;
        const h = (1 + Math.floor(Math.random() * 2)) * T;
        obstacles.push({ kind: 'block', x: cursor + gap, w, h });
        obstacles.push({ kind: 'spike', x: cursor + gap + w + 90 });
        cursor += gap + w + 200;
      } else {
        obstacles.push({ kind: 'spike', x: cursor + gap });
        cursor += gap + 60;
      }
    } else if (dist < 20000) {
      const gap = 420 + Math.random() * 250;
      if (r < 0.4) {
        // 三連尖刺
        obstacles.push({ kind: 'spike', x: cursor + gap });
        obstacles.push({ kind: 'spike', x: cursor + gap + T });
        obstacles.push({ kind: 'spike', x: cursor + gap + T * 2 });
        cursor += gap + T * 3 + 30;
      } else if (r < 0.7) {
        // 高方塊
        const w = (2 + Math.floor(Math.random() * 3)) * T;
        const h = (2 + Math.floor(Math.random() * 2)) * T;
        obstacles.push({ kind: 'block', x: cursor + gap, w, h });
        cursor += gap + w + 120;
      } else if (r < 0.9) {
        // 方塊 + 上方尖刺(踩著方塊跳尖刺)
        const w = T * 2;
        const h = T;
        obstacles.push({ kind: 'block', x: cursor + gap, w, h });
        obstacles.push({ kind: 'spike', x: cursor + gap + 30 });
        cursor += gap + w + 130;
      } else {
        obstacles.push({ kind: 'spike', x: cursor + gap });
        cursor += gap + 60;
      }
    } else {
      // 極限段
      const gap = 350 + Math.random() * 200;
      if (r < 0.5) {
        obstacles.push({ kind: 'spike', x: cursor + gap });
        obstacles.push({ kind: 'spike', x: cursor + gap + T });
        obstacles.push({ kind: 'spike', x: cursor + gap + T * 2 });
        cursor += gap + T * 3 + 30;
      } else if (r < 0.85) {
        const w = T * 3;
        const h = T * (2 + Math.floor(Math.random() * 2));
        obstacles.push({ kind: 'block', x: cursor + gap, w, h });
        obstacles.push({ kind: 'spike', x: cursor + gap + w + 80 });
        cursor += gap + w + 160;
      } else {
        obstacles.push({ kind: 'spike', x: cursor + gap });
        cursor += gap + 60;
      }
    }
  }

  return { obstacles, nextMaxX: cursor };
}
