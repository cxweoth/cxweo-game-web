// 迷宮 ASCII 與解析
//
// 字元意義:
//   '#' 牆、'.' 豆子、'o' 大力丸、'-' 鬼屋門、'P' 玩家起點、' ' 空地
//   注意:鬼屋內部用空格(空地);鬼的初始位置寫死在 physics 裡。
// 所有迷宮共用同一鬼屋區(row 7-12),玩家起點在迷宮底部 row 17。

import { CFG, type CellKind } from './types';

/** 第 1 張:經典對稱(L1, L4, L7, ...) */
const MAZE_0 = [
  '###################',
  '#........#........#',
  '#o##.###.#.###.##o#',
  '#.................#',
  '#.##.#.#####.#.##.#',
  '#....#...#...#....#',
  '####.### # ###.####',
  '####.#       #.####',
  '####.# ##-## #.####',
  '#....# #   # #....#',
  '#.##.# #   # #.##.#',
  '#....# ##### #....#',
  '####.#       #.####',
  '####.### # ###.####',
  '####.#       #.####',
  '#........#........#',
  '#.##.###.#.###.##.#',
  '#o.#.....P.....#.o#',
  '##.#.###.#.###.#.##',
  '#....#...#...#....#',
  '###################',
];

/** 第 2 張:走廊更開放,中央少一圈牆(L2, L5, L8, ...) */
const MAZE_1 = [
  '###################',
  '#o.......#.......o#',
  '#.###.##.#.##.###.#',
  '#.................#',
  '#.##.###...###.##.#',
  '#....#...#...#....#',
  '####.### # ###.####',
  '####.#       #.####',
  '####.# ##-## #.####',
  '#....# #   # #....#',
  '#.##.# #   # #.##.#',
  '#....# ##### #....#',
  '####.#       #.####',
  '####.### # ###.####',
  '####.#       #.####',
  '#....#...#...#....#',
  '#.##.###...###.##.#',
  '#.................#',
  '#.###.##.#.##.###.#',
  '#o.......P.......o#',
  '###################',
];

/** 第 3 張 = MAZE_0 左右鏡像(L3, L6, L9, ...);P / 鬼屋因對稱仍居中 */
function mirrorMaze(rows: ReadonlyArray<string>): string[] {
  return rows.map((line) => line.split('').reverse().join(''));
}

const MAZE_2 = mirrorMaze(MAZE_0);

const ALL_MAZES: ReadonlyArray<ReadonlyArray<string>> = [MAZE_0, MAZE_1, MAZE_2];

export function mazeForLevel(level: number): ReadonlyArray<string> {
  return ALL_MAZES[(level - 1) % ALL_MAZES.length] ?? MAZE_0;
}

export type Maze = {
  cells: CellKind[];
  pelletCount: number;
  /** 玩家起點(以 tile col/row 表示) */
  pacmanStart: { col: number; row: number };
};

export function parseMaze(level: number = 1): Maze {
  const raw = mazeForLevel(level);
  const cells: CellKind[] = [];
  let pelletCount = 0;
  let pacmanStart = { col: 9, row: 17 };
  for (let r = 0; r < CFG.rows; r++) {
    const line = raw[r] ?? '';
    for (let c = 0; c < CFG.cols; c++) {
      const ch = line[c] ?? ' ';
      if (ch === '#') cells.push('wall');
      else if (ch === '.') {
        cells.push('pellet');
        pelletCount++;
      } else if (ch === 'o') {
        cells.push('power');
        pelletCount++;
      } else if (ch === '-') {
        cells.push('door');
      } else if (ch === 'P') {
        pacmanStart = { col: c, row: r };
        cells.push('empty');
      } else {
        cells.push('empty');
      }
    }
  }
  return { cells, pelletCount, pacmanStart };
}

export function cellAt(cells: CellKind[], col: number, row: number): CellKind {
  if (col < 0 || col >= CFG.cols || row < 0 || row >= CFG.rows) return 'wall';
  return cells[row * CFG.cols + col]!;
}

export function setCell(cells: CellKind[], col: number, row: number, kind: CellKind): void {
  if (col < 0 || col >= CFG.cols || row < 0 || row >= CFG.rows) return;
  cells[row * CFG.cols + col] = kind;
}

/** Tile 中心像素 */
export function tileCenter(col: number, row: number): { x: number; y: number } {
  return { x: (col + 0.5) * CFG.cell, y: (row + 0.5) * CFG.cell };
}

/** 像素 → 所在 tile col/row(取最近) */
export function pixelToTile(x: number, y: number): { col: number; row: number } {
  return {
    col: Math.floor(x / CFG.cell),
    row: Math.floor(y / CFG.cell),
  };
}

/**
 * 某方向的下個格子是否可走。
 * forGhost = true 時,鬼可穿過 'door'(離開鬼屋);玩家不行。
 */
export function isPassable(
  cells: CellKind[],
  col: number,
  row: number,
  forGhost: boolean,
): boolean {
  const k = cellAt(cells, col, row);
  if (k === 'wall') return false;
  if (k === 'door') return forGhost;
  return true;
}
