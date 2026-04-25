// 每幀更新 + 命中 / 計分邏輯。

import {
  ensureRows,
  findAttachCell,
  findConnectedSameColor,
  findFloating,
  gridToPixel,
  randomColor,
} from './logic';
import { CFG, COLORS, type Color, type Flying, type Grid, type PopFx } from './types';

export type World = {
  grid: Grid;
  /** 飛行中的泡泡;非 null 時禁止再射擊 */
  flying: Flying | null;
  /** 下一顆泡泡顏色 */
  nextColor: Color;
  /** 目前裝填顏色 */
  currentColor: Color;
  /** 瞄準角度（度,從正上算,左負右正） */
  aimDeg: number;
  /** 連續未爆破的射擊次數,觸發整列下推 */
  shotsSincePop: number;
  popFx: PopFx[];
};

export function createWorld(): World {
  const grid: Grid = [];
  ensureRows(grid, CFG.initRows);
  // 隨機填入前幾列(每列大約 70% 機率有泡泡 + 隨機色)
  for (let r = 0; r < CFG.initRows; r++) {
    for (let c = 0; c < CFG.cols; c++) {
      if (Math.random() < 0.85) {
        grid[r]![c] = { color: COLORS[Math.floor(Math.random() * COLORS.length)]! };
      }
    }
  }
  const currentColor = randomColor(grid);
  const nextColor = randomColor(grid);
  return {
    grid,
    flying: null,
    nextColor,
    currentColor,
    aimDeg: 0,
    shotsSincePop: 0,
    popFx: [],
  };
}

export function tickPhysics(
  world: World,
  dt: number,
  alive: boolean,
  onScore: (points: number) => void,
  onGameOver: () => void,
  onWin: () => void,
): void {
  // 子彈飛行
  if (alive && world.flying) {
    const f = world.flying;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    // 撞兩側 → 反彈
    if (f.x < CFG.bubbleR) {
      f.x = CFG.bubbleR;
      f.vx = -f.vx;
    } else if (f.x > CFG.width - CFG.bubbleR) {
      f.x = CFG.width - CFG.bubbleR;
      f.vx = -f.vx;
    }
    // 撞頂 → 黏到頂
    if (f.y < CFG.bubbleR) {
      attachAndResolve(world, f.x, CFG.bubbleR, f.color, onScore, onGameOver, onWin);
      world.flying = null;
    } else {
      // 撞既有泡泡
      const hitDistSq = (CFG.bubbleR * 2 - 2) ** 2;
      let hit = false;
      for (let r = 0; r < world.grid.length && !hit; r++) {
        for (let c = 0; c < CFG.cols && !hit; c++) {
          if (!world.grid[r]?.[c]) continue;
          const p = gridToPixel(r, c);
          const d = (p.x - f.x) ** 2 + (p.y - f.y) ** 2;
          if (d < hitDistSq) hit = true;
        }
      }
      if (hit) {
        attachAndResolve(world, f.x, f.y, f.color, onScore, onGameOver, onWin);
        world.flying = null;
      }
    }
  }
  // 爆裂特效更新
  for (const p of world.popFx) p.age += dt;
  world.popFx = world.popFx.filter((p) => p.age < p.ttl);
}

function attachAndResolve(
  world: World,
  x: number,
  y: number,
  color: Color,
  onScore: (points: number) => void,
  onGameOver: () => void,
  onWin: () => void,
): void {
  const cell = findAttachCell(world.grid, x, y);
  if (!cell) return;
  ensureRows(world.grid, cell.row + 1);
  if (cell.col < 0 || cell.col >= CFG.cols) return;
  world.grid[cell.row]![cell.col] = { color };

  // 連通同色 ≥ 3 → 爆
  const connected = findConnectedSameColor(world.grid, cell.row, cell.col, color);
  let popped = 0;
  if (connected.length >= 3) {
    for (const [r, c] of connected) {
      const p = gridToPixel(r, c);
      world.popFx.push({ x: p.x, y: p.y, color, age: 0, ttl: 0.5 });
      world.grid[r]![c] = null;
    }
    popped = connected.length;
    onScore(popped * 10);

    // 漂浮泡泡掉落
    const floating = findFloating(world.grid);
    for (const [r, c] of floating) {
      const f = world.grid[r]![c]!;
      const p = gridToPixel(r, c);
      world.popFx.push({ x: p.x, y: p.y, color: f.color, age: 0, ttl: 0.7 });
      world.grid[r]![c] = null;
    }
    if (floating.length > 0) onScore(floating.length * 20);

    world.shotsSincePop = 0;
  } else {
    world.shotsSincePop++;
    // 連續多次未消 → 整盤往下推
    if (world.shotsSincePop >= CFG.pushDownAfterShots) {
      world.shotsSincePop = 0;
      pushDown(world);
    }
  }

  // 勝負檢查
  if (isClear(world.grid)) {
    onWin();
    return;
  }
  if (touchedLoseRow(world.grid)) {
    onGameOver();
    return;
  }

  // 換下一顆
  world.currentColor = world.nextColor;
  world.nextColor = randomColor(world.grid);
}

function pushDown(world: World): void {
  // 在最上方插一列新隨機泡泡(其餘整體向下移)
  const newRow = Array.from({ length: CFG.cols }, () => {
    if (Math.random() < 0.85) {
      return { color: COLORS[Math.floor(Math.random() * COLORS.length)]! };
    }
    return null;
  });
  world.grid.unshift(newRow);
}

function isClear(grid: Grid): boolean {
  for (const row of grid) for (const c of row) if (c) return false;
  return true;
}

function touchedLoseRow(grid: Grid): boolean {
  for (let r = CFG.loseRow; r < grid.length; r++) {
    for (let c = 0; c < CFG.cols; c++) {
      if (grid[r]?.[c]) return true;
    }
  }
  return false;
}
