// 迷宮吃豆 — 鬼魂 AI
//
// 簡化版經典 Pac-Man AI:
//   - blinky:目標 = 玩家位置(直追)
//   - pinky :目標 = 玩家前方 4 格(伏擊)
//   - inky  :目標 = 「以 blinky 為支點對映玩家前 2 格」(從反向夾擊)
//   - clyde :遠時(> 8 格)追玩家、近時(<= 8 格)跑回左下角
//
// 在 tile center 時重選方向(不能 180° 反向,除非死路)。frightened 隨機;
// eaten 朝鬼屋門(col 9, row 8)直線回家。

import { isPassable } from './maze';
import {
  CFG,
  DIR_DX,
  DIR_DY,
  opposite,
  type CellKind,
  type Direction,
  type Ghost,
  type GhostKind,
  type Pacman,
} from './types';

const HOME_DOOR_COL = 9;
const HOME_DOOR_ROW = 8;
const HOME_INSIDE_ROW = 9;

const DIRS_ALL: Direction[] = ['up', 'down', 'left', 'right'];

const SCATTER_CORNER: Record<GhostKind, [number, number]> = {
  blinky: [CFG.cols - 2, 1],
  pinky: [1, 1],
  inky: [CFG.cols - 2, CFG.rows - 2],
  clyde: [1, CFG.rows - 2],
};

export function ghostInitialDir(_kind: GhostKind): Direction {
  return 'up';
}

function tileOf(x: number, y: number): { col: number; row: number } {
  return {
    col: Math.floor(x / CFG.cell),
    row: Math.floor(y / CFG.cell),
  };
}

function ghostTargetTile(
  g: Ghost,
  pacman: Pacman,
  ghosts: Ghost[],
): { col: number; row: number } {
  if (g.mode === 'eaten') return { col: HOME_DOOR_COL, row: HOME_DOOR_ROW };
  if (g.mode === 'frightened') {
    // 隨機目標 — 但因為 frightened 走法另外處理,此值不會被用
    return { col: 0, row: 0 };
  }
  const p = tileOf(pacman.x, pacman.y);
  const dx = DIR_DX[pacman.dir];
  const dy = DIR_DY[pacman.dir];

  switch (g.kind) {
    case 'blinky':
      return p;
    case 'pinky':
      return { col: p.col + dx * 4, row: p.row + dy * 4 };
    case 'inky': {
      const blinky = ghosts.find((x) => x.kind === 'blinky') ?? g;
      const bt = tileOf(blinky.x, blinky.y);
      const fx = p.col + dx * 2;
      const fy = p.row + dy * 2;
      // 以 blinky 為支點,對 (fx,fy) 做 2 倍延伸
      return { col: fx + (fx - bt.col), row: fy + (fy - bt.row) };
    }
    case 'clyde': {
      const dist2 = (p.col - tileOf(g.x, g.y).col) ** 2 + (p.row - tileOf(g.x, g.y).row) ** 2;
      if (dist2 > 64) return p;
      const [cx, cy] = SCATTER_CORNER.clyde;
      return { col: cx, row: cy };
    }
  }
}

/**
 * 在 tile center 時重新選擇方向。每幀都呼叫;只在「位置接近 tile center」時才會生效。
 * mode 切換(home → chase、eaten → home、frightened → chase)也在這做。
 */
export function advanceGhostAi(
  g: Ghost,
  pacman: Pacman,
  ghosts: Ghost[],
  cells: CellKind[],
  dt: number,
): void {
  // home → 計時等出獄
  if (g.mode === 'home') {
    g.homeT += dt;
    // 在屋內小幅上下擺動(視覺活潑)
    const targetRow = HOME_INSIDE_ROW;
    const tc = (HOME_INSIDE_ROW + 0.5) * CFG.cell;
    if (Math.abs(g.y - tc) < 1) {
      g.dir = g.dir === 'up' ? 'down' : 'up';
    }
    if (g.homeT >= g.homeReleaseAt) {
      // 傳送到門外開始 chase
      g.x = (HOME_DOOR_COL + 0.5) * CFG.cell;
      g.y = (HOME_DOOR_ROW - 1 + 0.5) * CFG.cell;
      g.mode = 'chase';
      g.dir = Math.random() < 0.5 ? 'left' : 'right';
      g.homeT = 0;
      void targetRow;
      return;
    }
    return;
  }

  // frightened 倒數
  if (g.mode === 'frightened') {
    g.frightT -= dt;
    if (g.frightT <= 0) {
      g.mode = 'chase';
    }
  }

  // eaten 抵達門口 → 切 home
  if (g.mode === 'eaten') {
    const tc = tileOf(g.x, g.y);
    if (tc.col === HOME_DOOR_COL && tc.row === HOME_DOOR_ROW) {
      g.mode = 'home';
      g.homeT = 0;
      g.homeReleaseAt = 1.4;
      return;
    }
  }

  // 在 tile center 附近才重新選方向
  const col = Math.floor(g.x / CFG.cell);
  const row = Math.floor(g.y / CFG.cell);
  const cx = (col + 0.5) * CFG.cell;
  const cy = (row + 0.5) * CFG.cell;
  if (Math.abs(g.x - cx) > 1.5 || Math.abs(g.y - cy) > 1.5) return;
  // snap 到 center
  g.x = cx;
  g.y = cy;

  // 候選方向(排除反向)
  const opp = opposite(g.dir);
  const choices: Direction[] = [];
  for (const d of DIRS_ALL) {
    if (d === opp) continue;
    if (!isPassable(cells, col + DIR_DX[d], row + DIR_DY[d], true)) continue;
    choices.push(d);
  }
  if (choices.length === 0) {
    // 死路 → 強制反向
    if (isPassable(cells, col + DIR_DX[opp], row + DIR_DY[opp], true)) {
      g.dir = opp;
    }
    return;
  }

  if (g.mode === 'frightened') {
    g.dir = choices[Math.floor(Math.random() * choices.length)]!;
    return;
  }

  // 選最近 target 的 choice
  const target = ghostTargetTile(g, pacman, ghosts);
  let best = Infinity;
  let bestDir: Direction = choices[0]!;
  for (const d of choices) {
    const nc = col + DIR_DX[d];
    const nr = row + DIR_DY[d];
    const dist = (nc - target.col) ** 2 + (nr - target.row) ** 2;
    if (dist < best) {
      best = dist;
      bestDir = d;
    }
  }
  g.dir = bestDir;
}
