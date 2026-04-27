// 主要繪製 — 把背景、子彈、蜜蜂、玩家、HUD 串起來。

import { CFG, type Bee, type Bomb, type Bullet, type Ship } from './types';
import { drawBackground } from './render-bg';
import { drawBee } from './render-bee';
import { drawBomb, drawBullet, drawShip } from './render-ship';
import { drawHUD } from './render-hud';

type DrawState = {
  ship: Ship;
  bees: ReadonlyArray<Bee>;
  bullets: ReadonlyArray<Bullet>;
  bombs: ReadonlyArray<Bomb>;
  score: number;
  best: number | null;
  lives: number;
  wave: number;
  /** 累計 dt — 火焰、星空動畫用 */
  totalTime: number;
  /** 這幀的 dt(背景星空滾動需要) */
  dt: number;
};

export function drawScene(ctx: CanvasRenderingContext2D, s: DrawState): void {
  ctx.clearRect(0, 0, CFG.width, CFG.height);
  drawBackground(ctx, s.dt);

  // 子彈在最底層(被蜜蜂蓋住)
  for (const b of s.bullets) {
    if (b.alive) drawBullet(ctx, b.x, b.y);
  }

  // 蜜蜂
  for (const bee of s.bees) {
    drawBee(ctx, bee);
  }

  // 蜜蜂炸彈
  for (const bo of s.bombs) {
    if (bo.alive) drawBomb(ctx, bo.x, bo.y);
  }

  // 玩家
  drawShip(ctx, s.ship, s.totalTime);

  // HUD 最上層
  drawHUD(ctx, s.score, s.best, s.lives, s.wave);
}
