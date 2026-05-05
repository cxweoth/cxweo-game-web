// 主繪製聚合 — Canvas 元件每幀只呼叫 drawScene

import { drawBackground } from './render-bg';
import { drawFloatTexts, drawParticles } from './render-fx';
import { drawGoblin } from './render-goblin';
import { drawHUD } from './render-hud';
import { drawKnight } from './render-knight';
import {
  CFG,
  type BossState,
  type FloatText,
  type Particle,
  type PlayerState,
} from './types';

export type Scene = {
  player: PlayerState;
  boss: BossState;
  particles: Particle[];
  floatTexts: FloatText[];
  shake: { dx: number; dy: number };
  playerHP: number;
  bossHP: number;
  time: number;
  nowMs: number;
};

export function drawScene(ctx: CanvasRenderingContext2D, s: Scene): void {
  ctx.save();
  ctx.translate(s.shake.dx, s.shake.dy);

  drawBackground(ctx, s.time);
  // 角色:活的先畫(順序不影響但讓 boss 在 knight 後面看起來大塊感更好)
  drawKnight(ctx, s.player, s.nowMs);
  drawGoblin(ctx, s.boss, s.nowMs);
  drawParticles(ctx, s.particles);
  drawFloatTexts(ctx, s.floatTexts);

  ctx.restore();

  // HUD 不參與震動
  drawHUD(ctx, s.playerHP, s.bossHP);
  void CFG;
}
