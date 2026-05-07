// 迷宮吃豆 — 世界推進(玩家移動 + 鬼移動 + 吃豆 + 碰撞 + 水果 + 難度遞增)

import { advanceGhostAi, ghostInitialDir } from './ai';
import { isPassable, parseMaze, setCell, tileCenter, cellAt } from './maze';
import {
  CFG,
  DIR_DX,
  DIR_DY,
  fruitForLevel,
  type CellKind,
  type Direction,
  type Fruit,
  type Ghost,
  type GhostKind,
  type Pacman,
} from './types';

export type World = {
  cells: CellKind[];
  pacman: Pacman;
  ghosts: Ghost[];
  pelletsLeft: number;
  pelletsAtStart: number;
  score: number;
  lives: number;
  level: number;
  ghostCombo: number;
  globalFrightT: number;
  fruit: Fruit | null;
  fruitSpawned: boolean;
  startCol: number;
  startRow: number;
};

const GHOST_KINDS: GhostKind[] = ['blinky', 'pinky', 'inky', 'clyde'];
const GHOST_HOME_RELEASE: Record<GhostKind, number> = {
  blinky: 0,
  pinky: 2,
  inky: 4,
  clyde: 6,
};
const GHOST_HOME_TILES: Record<GhostKind, [number, number]> = {
  blinky: [9, 9],
  pinky: [8, 9],
  inky: [10, 9],
  clyde: [9, 10],
};
/** 水果在迷宮中的固定位置(鬼屋下方,所有迷宮通用) */
const FRUIT_TILE: [number, number] = [9, 14];

export function levelGhostMult(level: number): number {
  return Math.min(CFG.ghostSpeedScaleMax, 1 + (level - 1) * CFG.ghostSpeedScale);
}

export function levelFrightDur(level: number): number {
  return Math.max(CFG.frightDurMin, CFG.frightDur - (level - 1) * CFG.frightDurDecay);
}

export function createWorld(): World {
  const m = parseMaze(1);
  const start = tileCenter(m.pacmanStart.col, m.pacmanStart.row);
  const ghosts: Ghost[] = GHOST_KINDS.map((k) => {
    const [c, r] = GHOST_HOME_TILES[k];
    const p = tileCenter(c, r);
    return {
      kind: k,
      x: p.x,
      y: p.y,
      dir: ghostInitialDir(k),
      mode: k === 'blinky' ? 'chase' : 'home',
      homeT: 0,
      homeReleaseAt: GHOST_HOME_RELEASE[k],
      frightT: 0,
    };
  });
  return {
    cells: [...m.cells],
    pacman: {
      x: start.x,
      y: start.y,
      dir: 'left',
      desiredDir: 'left',
      mouthPhase: 0,
      alive: true,
    },
    ghosts,
    pelletsLeft: m.pelletCount,
    pelletsAtStart: m.pelletCount,
    score: 0,
    lives: CFG.initialLives,
    level: 1,
    ghostCombo: 0,
    globalFrightT: 0,
    fruit: null,
    fruitSpawned: false,
    startCol: m.pacmanStart.col,
    startRow: m.pacmanStart.row,
  };
}

export function resetActors(world: World): void {
  const start = tileCenter(world.startCol, world.startRow);
  world.pacman.x = start.x;
  world.pacman.y = start.y;
  world.pacman.dir = 'left';
  world.pacman.desiredDir = 'left';
  world.pacman.alive = true;
  for (const g of world.ghosts) {
    const [c, r] = GHOST_HOME_TILES[g.kind];
    const p = tileCenter(c, r);
    g.x = p.x;
    g.y = p.y;
    g.dir = ghostInitialDir(g.kind);
    g.mode = g.kind === 'blinky' ? 'chase' : 'home';
    g.homeT = 0;
    g.frightT = 0;
  }
  world.ghostCombo = 0;
  world.globalFrightT = 0;
}

export function resetLevel(world: World): void {
  const newLevel = world.level + 1;
  const m = parseMaze(newLevel);
  world.cells = [...m.cells];
  world.pelletsLeft = m.pelletCount;
  world.pelletsAtStart = m.pelletCount;
  world.level = newLevel;
  world.fruit = null;
  world.fruitSpawned = false;
  world.startCol = m.pacmanStart.col;
  world.startRow = m.pacmanStart.row;
  resetActors(world);
}

function moveActor(
  actor: { x: number; y: number; dir: Direction },
  speedPxPerSec: number,
  dt: number,
  cells: CellKind[],
  forGhost: boolean,
): void {
  if (actor.dir === 'none') return;
  const dx = DIR_DX[actor.dir];
  const dy = DIR_DY[actor.dir];
  const dist = speedPxPerSec * dt;
  let nx = actor.x + dx * dist;
  let ny = actor.y + dy * dist;
  const aheadCol = Math.floor((nx + dx * (CFG.cell / 2 - 1)) / CFG.cell);
  const aheadRow = Math.floor((ny + dy * (CFG.cell / 2 - 1)) / CFG.cell);
  if (!isPassable(cells, aheadCol, aheadRow, forGhost)) {
    const curCol = Math.floor(actor.x / CFG.cell);
    const curRow = Math.floor(actor.y / CFG.cell);
    const cx = (curCol + 0.5) * CFG.cell;
    const cy = (curRow + 0.5) * CFG.cell;
    if (dx > 0 && nx > cx) nx = cx;
    if (dx < 0 && nx < cx) nx = cx;
    if (dy > 0 && ny > cy) ny = cy;
    if (dy < 0 && ny < cy) ny = cy;
  }
  actor.x = nx;
  actor.y = ny;
}

function tryTurn(
  actor: { x: number; y: number; dir: Direction },
  desired: Direction,
  cells: CellKind[],
  forGhost: boolean,
): void {
  if (desired === 'none' || desired === actor.dir) return;
  const col = Math.floor(actor.x / CFG.cell);
  const row = Math.floor(actor.y / CFG.cell);
  const cx = (col + 0.5) * CFG.cell;
  const cy = (row + 0.5) * CFG.cell;
  if (Math.abs(actor.x - cx) > 3.5 || Math.abs(actor.y - cy) > 3.5) return;
  const dx = DIR_DX[desired];
  const dy = DIR_DY[desired];
  if (!isPassable(cells, col + dx, row + dy, forGhost)) return;
  actor.x = cx;
  actor.y = cy;
  actor.dir = desired;
}

export function tickPhysics(
  world: World,
  dt: number,
  status: 'playing' | 'idle',
  onScoreChange: () => void,
  onPacmanCaught: () => void,
  onLevelClear: () => void,
): void {
  if (status !== 'playing') return;
  const { pacman, ghosts, cells } = world;
  const ghostMult = levelGhostMult(world.level);

  // --- 玩家移動 ---
  tryTurn(pacman, pacman.desiredDir, cells, false);
  moveActor(pacman, CFG.pacmanSpeed * CFG.cell, dt, cells, false);
  pacman.mouthPhase += dt * 8;

  // --- 吃豆判定 ---
  const pCol = Math.floor(pacman.x / CFG.cell);
  const pRow = Math.floor(pacman.y / CFG.cell);
  const cellHere = cellAt(cells, pCol, pRow);
  if (cellHere === 'pellet') {
    setCell(cells, pCol, pRow, 'empty');
    world.pelletsLeft--;
    world.score += CFG.pelletScore;
    onScoreChange();
  } else if (cellHere === 'power') {
    setCell(cells, pCol, pRow, 'empty');
    world.pelletsLeft--;
    world.score += CFG.powerScore;
    const dur = levelFrightDur(world.level);
    world.globalFrightT = dur;
    world.ghostCombo = 0;
    for (const g of ghosts) {
      if (g.mode === 'chase' || g.mode === 'home') {
        g.mode = 'frightened';
        g.frightT = dur;
        const opp: Direction =
          g.dir === 'up' ? 'down' :
          g.dir === 'down' ? 'up' :
          g.dir === 'left' ? 'right' :
          g.dir === 'right' ? 'left' : 'none';
        const gCol = Math.floor(g.x / CFG.cell);
        const gRow = Math.floor(g.y / CFG.cell);
        if (opp !== 'none' && isPassable(cells, gCol + DIR_DX[opp], gRow + DIR_DY[opp], true)) {
          g.dir = opp;
        }
      }
    }
    onScoreChange();
  }
  if (world.pelletsLeft <= 0) {
    onLevelClear();
    return;
  }

  // --- 水果觸發 ---
  if (!world.fruitSpawned) {
    const eaten = world.pelletsAtStart - world.pelletsLeft;
    if (eaten >= world.pelletsAtStart * CFG.fruitTriggerRatio) {
      const def = fruitForLevel(world.level);
      world.fruit = {
        kind: def.kind,
        col: FRUIT_TILE[0],
        row: FRUIT_TILE[1],
        ttl: CFG.fruitTtl,
        score: def.score,
      };
      world.fruitSpawned = true;
    }
  }

  // --- 水果 tick + 碰撞 ---
  if (world.fruit) {
    world.fruit.ttl -= dt;
    if (world.fruit.ttl <= 0) {
      world.fruit = null;
    } else if (pCol === world.fruit.col && pRow === world.fruit.row) {
      world.score += world.fruit.score;
      world.fruit = null;
      onScoreChange();
    }
  }

  // --- 全域 fright timer ---
  if (world.globalFrightT > 0) world.globalFrightT = Math.max(0, world.globalFrightT - dt);

  // --- 鬼:AI + 移動 ---
  for (const g of ghosts) {
    advanceGhostAi(g, pacman, ghosts, cells, dt);
    let speed: number = CFG.ghostSpeed * ghostMult;
    if (g.mode === 'frightened') speed = CFG.ghostFrightSpeed * ghostMult;
    if (g.mode === 'eaten') speed = CFG.ghostEatenSpeed;
    moveActor(g, speed * CFG.cell, dt, cells, true);
  }

  // --- Pacman vs Ghost 碰撞 ---
  for (const g of ghosts) {
    const dist = Math.hypot(g.x - pacman.x, g.y - pacman.y);
    if (dist > CFG.cell * 0.7) continue;
    if (g.mode === 'frightened') {
      const score = CFG.ghostScores[Math.min(world.ghostCombo, CFG.ghostScores.length - 1)]!;
      world.score += score;
      world.ghostCombo++;
      onScoreChange();
      g.mode = 'eaten';
      g.frightT = 0;
    } else if (g.mode === 'eaten') {
      // skip
    } else {
      onScoreChange();
      onPacmanCaught();
      pacman.alive = false;
      return;
    }
  }
}
