// 主繪製聚合

import { drawFruit, drawMaze } from './render-bg';
import { drawGhost, drawPacman } from './render-actors';
import { drawHUD } from './render-hud';
import {
  CANVAS_H,
  CANVAS_W,
  type CellKind,
  type Fruit,
  type Ghost,
  type Pacman,
} from './types';

export type Scene = {
  cells: CellKind[];
  pacman: Pacman;
  ghosts: Ghost[];
  fruit: Fruit | null;
  globalFrightT: number;
  score: number;
  highScore: number;
  lives: number;
  level: number;
  alive: boolean;
  time: number;
};

export function drawScene(ctx: CanvasRenderingContext2D, s: Scene): void {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawMaze(ctx, s.cells, s.time);
  if (s.fruit) drawFruit(ctx, s.fruit, s.time);
  for (const g of s.ghosts) drawGhost(ctx, g, s.globalFrightT, s.time);
  drawPacman(ctx, s.pacman, s.alive);
  drawHUD(ctx, s.score, s.highScore, s.lives, s.level);
}
