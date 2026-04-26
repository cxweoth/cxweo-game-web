// 下樓梯主要繪製函式 — 把背景、階梯、角色、HUD 串起來。
// 各子模組分散在 render-bg.ts / render-stairs.ts / render-char.ts / render-hud.ts。

import { CFG, type Character, type Images, type Stair } from './types';
import { drawBackground, drawCeiling } from './render-bg';
import { drawStair, drawSpikeTips } from './render-stairs';
import { drawCharacter } from './render-char';
import { drawHUD } from './render-hud';

type DrawState = {
  char: Character;
  stairs: ReadonlyArray<Stair>;
  hp: number;
  score: number;
  best: number | null;
  /** 走路動畫累計時間;0 = idle */
  walkAnim: number;
  /** 累計總時間(秒);滾輪 / 動畫使用 */
  totalTime: number;
  /** 物理累計遊戲時間(秒);crumbling/flip 進度依此計算 */
  elapsedSec: number;
  /** 最近一次受傷的時刻;角色閃紅用 */
  lastDamageAtSec: number;
  /** null = 圖還沒載完成,用 fallback 繪圖 */
  images: Images | null;
};

export function drawScene(ctx: CanvasRenderingContext2D, s: DrawState): void {
  ctx.clearRect(0, 0, CFG.width, CFG.height);
  drawBackground(ctx, s.images);
  drawCeiling(ctx, s.images);
  // 第一趟:全部階梯(spike 只畫基座,尖端留到第三趟)— 角色會踩在這層之上
  for (const stair of s.stairs) drawStair(ctx, stair, s.images, s.totalTime, s.elapsedSec);
  // 第二趟:角色(受傷閃紅:flashAlpha > 0 → 用 HURT 色板;= 0 → 用 NORMAL 色板)
  const flashAlpha = damageFlashAlpha(s.elapsedSec - s.lastDamageAtSec);
  drawCharacter(ctx, s.char, s.walkAnim, flashAlpha);
  // 第三趟:spike 的尖刺,蓋在角色之上 → 踩到時刺會「穿過」身體
  for (const stair of s.stairs) {
    if (stair.type === 'spike') drawSpikeTips(ctx, stair);
  }
  drawHUD(ctx, s.hp, s.score, s.best);
}

/** 受傷後 0..duration 秒之間的紅色覆蓋 alpha;
 *  以 damageFlashHz 的方波切「亮/滅」,讓角色像被打到一樣抖動閃爍。 */
function damageFlashAlpha(timeSinceDamage: number): number {
  if (timeSinceDamage < 0 || timeSinceDamage >= CFG.damageFlashDuration) return 0;
  const fade = 1 - timeSinceDamage / CFG.damageFlashDuration;
  const blinkOn = Math.floor(timeSinceDamage * CFG.damageFlashHz) % 2 === 0;
  return blinkOn ? CFG.damageFlashAlpha * fade : 0;
}
