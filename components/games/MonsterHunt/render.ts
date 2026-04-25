// 主繪製 orchestrator — 把背景、角色、HUD、特效串起來。
// 不持狀態、不做物理。

import { CFG, type Arrow, type DeathFx, type Fireball, type Particle } from './types';
import { drawGround, drawSky, drawStars, drawTrees } from './render-bg';
import { drawArrow, drawFireball, drawMonster, drawPlayer } from './render-actors';
import { drawHP } from './render-hud';
import {
  drawDeadMonster,
  drawDeadPlayer,
  drawDeathBurst,
  drawDeathText,
  drawParticles,
} from './fx';

type DrawState = {
  playerY: number;
  monsterY: number;
  monsterHP: number;
  playerHP: number;
  arrows: ReadonlyArray<Arrow>;
  fireballs: ReadonlyArray<Fireball>;
  /** 累積時間（秒），給呼吸 / 飄動效果用 */
  time: number;
  /** performance.now() 當下時間，給死亡特效計時 */
  nowMs: number;
  /** 受擊閃光終點時間（performance.now ms） */
  monsterFlashUntil: number;
  playerFlashUntil: number;
  shake: { x: number; y: number };
  /** 死亡特效；非 null 時對應角色不畫活體 */
  monsterDeath: DeathFx | null;
  playerDeath: DeathFx | null;
  particles: ReadonlyArray<Particle>;
};

export function drawScene(ctx: CanvasRenderingContext2D, s: DrawState): void {
  ctx.clearRect(0, 0, CFG.width, CFG.height);

  // 震動：把整個場景 translate（HUD 不跟著震）
  ctx.save();
  ctx.translate(s.shake.x, s.shake.y);

  drawSky(ctx);
  drawStars(ctx, s.time);
  drawTrees(ctx);
  drawGround(ctx);

  if (s.playerDeath) {
    drawDeadPlayer(ctx, s.playerDeath, s.nowMs);
  } else {
    drawPlayer(ctx, s.playerY, s.time, s.playerFlashUntil > s.nowMs);
  }

  if (s.monsterDeath) {
    drawDeadMonster(ctx, s.monsterDeath, s.nowMs);
  } else {
    drawMonster(ctx, s.monsterY, s.time, s.monsterFlashUntil > s.nowMs, s.monsterHP);
  }

  for (const f of s.fireballs) drawFireball(ctx, f);
  for (const a of s.arrows) drawArrow(ctx, a);

  drawParticles(ctx, s.particles);
  if (s.monsterDeath) {
    drawDeathBurst(ctx, s.monsterDeath, s.nowMs);
    drawDeathText(ctx, s.monsterDeath, s.nowMs);
  }
  if (s.playerDeath) {
    drawDeathBurst(ctx, s.playerDeath, s.nowMs);
    drawDeathText(ctx, s.playerDeath, s.nowMs);
  }

  ctx.restore();

  drawHP(ctx, s.playerHP, s.monsterHP);
}
