// 角色繪製的 transform 包裝層 — 負責 squash/stretch 彈跳動畫,
// 真正的 sprite 繪製委託給 render-man.ts(純 procedural,正常 + 受傷兩種色板)。

import { CFG, type Character } from './types';
import { drawMan } from './render-man';

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  c: Character,
  walkAnim: number,
  flashAlpha: number,
): void {
  const transform = bounceTransform(c);
  // 受傷閃爍:render.ts 的 damageFlashAlpha 已經做了「12Hz 方波切換」+ 「線性衰減」,
  // 這裡只要 alpha > 0 就用紅色受傷 sprite,等於每秒 12 次切換 NORMAL ↔ HURT
  const hurt = flashAlpha > 0;

  ctx.save();
  if (transform) {
    // 以「腳底中心」為錨點做 squash & stretch:壓扁時看起來像被彈簧壓進地板,
    // 拉長時人會從腳往上抽,符合卡通彈簧的物理直覺
    const anchorX = c.x;
    const anchorY = c.y + CFG.charH;
    ctx.translate(anchorX, anchorY);
    ctx.scale(transform.sx, transform.sy);
    ctx.translate(-anchorX, -anchorY);
  }
  drawMan(ctx, c, walkAnim, hurt);
  ctx.restore();
}

/**
 * 計算彈跳變形(squash → stretch → 自然)
 *
 * 階段:
 *   0..bounceSquashDuration       壓扁(剛接觸彈簧那幀)
 *   接著到 bounceAnimDuration     依 vy 線性插值「拉長」(vy 越負拉得越誇張)
 *   bounceAnim < 0                完全沒在彈跳 → 不變形
 */
function bounceTransform(c: Character): { sx: number; sy: number } | null {
  if (c.bounceAnim < 0) return null;
  if (c.bounceAnim < CFG.bounceSquashDuration) {
    return { sx: CFG.bounceSquashSx, sy: CFG.bounceSquashSy };
  }
  const upRatio = c.vy < 0 ? Math.min(1, -c.vy / CFG.bounceVy) : 0;
  const stretch = upRatio;
  return {
    sx: 1 - (1 - CFG.bounceStretchSx) * stretch,
    sy: 1 + (CFG.bounceStretchSy - 1) * stretch,
  };
}
