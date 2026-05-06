// 主繪製聚合

import { drawBackground } from './render-bg';
import { drawCube, drawObstacles } from './render-actors';
import { drawParticles } from './render-fx';
import { drawHUD } from './render-hud';
import type { Obstacle, Particle, PlayerState } from './types';

export type Scene = {
  player: PlayerState;
  obstacles: ReadonlyArray<Obstacle>;
  particles: Particle[];
  cameraX: number;
  alive: boolean;
  isEndless: boolean;
  best: number | null;
  showJumpHint: boolean;
};

export function drawScene(ctx: CanvasRenderingContext2D, s: Scene): void {
  drawBackground(ctx, s.cameraX);
  drawObstacles(ctx, s.obstacles, s.cameraX);
  drawCube(ctx, s.player, s.alive);
  drawParticles(ctx, s.particles);
  drawHUD(ctx, s.cameraX, s.isEndless, s.best, s.showJumpHint);
}
