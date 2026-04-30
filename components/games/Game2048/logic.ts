import { GRID_SIZE, type Direction, type Game2048State, type Tile } from './types';

// id 生成器:模組級單調遞增,確保所有 tiles 都有唯一 React key。
// 重新整理頁面時會從 1 重來,但 React 不會混淆,因為舊 tiles 此時也都不存在。
let nextId = 1;
function makeId(): number {
  return nextId++;
}

/** 蒐集現有 tiles 占用的格子,回傳所有空格 */
function emptyCells(tiles: ReadonlyArray<Tile>): Array<{ row: number; col: number }> {
  const occ = new Set<number>();
  for (const t of tiles) occ.add(t.row * GRID_SIZE + t.col);
  const out: Array<{ row: number; col: number }> = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!occ.has(r * GRID_SIZE + c)) out.push({ row: r, col: c });
    }
  }
  return out;
}

/** 在隨機空格生成一顆新 tile;90% 為 2、10% 為 4。沒有空格時回 null。 */
function spawnTile(tiles: ReadonlyArray<Tile>, markNew = true): Tile | null {
  const empties = emptyCells(tiles);
  if (empties.length === 0) return null;
  const pick = empties[Math.floor(Math.random() * empties.length)]!;
  return {
    id: makeId(),
    value: Math.random() < 0.9 ? 2 : 4,
    row: pick.row,
    col: pick.col,
    isNew: markNew,
  };
}

/** 取出某一條軸線(row 固定 / col 固定)上的 tiles,依方向排序好以便依序處理 */
function lineFor(
  tiles: ReadonlyArray<Tile>,
  axis: 'row' | 'col',
  index: number,
  asc: boolean,
): Tile[] {
  const line = tiles.filter((t) => (axis === 'row' ? t.row : t.col) === index);
  line.sort((a, b) => {
    const ka = axis === 'row' ? a.col : a.row;
    const kb = axis === 'row' ? b.col : b.row;
    return asc ? ka - kb : kb - ka;
  });
  return line;
}

type SlideOutput = {
  /** 滑動完成後棋盤的正規 tiles(每格至多一個) */
  tiles: Tile[];
  /** 滑動中被合併、需要保留動畫期的源 tiles(已搬到目的格、和 merged tile 同位) */
  vanishing: Tile[];
  scoreGain: number;
  /** 整盤是否有任何 tile 移動或合併;若無則本次方向不算合法操作 */
  changed: boolean;
};

/**
 * 把所有 tiles 沿指定方向滑動並合併。純函式,不修改輸入陣列。
 *
 * 演算法(以向左為例):
 * - 對每一列從左到右逐一處理 tile。
 * - 用 writePos 指向「下一個落點欄位」,初始 0。
 * - 若新 tile 跟「上一個剛落下的、且本回合尚未合併過的」tile 同值 → 合併:
 *   兩個源 tile 都搬到合併目的格(writePos-1),標為 vanishing;
 *   新增一顆雙倍值 tile,標 isMerged。writePos 不變(被合併占用)。
 * - 否則 tile 落到 writePos,writePos++。
 *
 * 「本回合尚未合併過」用 lastMerged 旗標保證:[2,2,4] 向左 → [4,4,_],
 * 不會變 [8,_,_]。
 */
function slide(tiles: ReadonlyArray<Tile>, dir: Direction): SlideOutput {
  const horizontal = dir === 'left' || dir === 'right';
  const axis: 'row' | 'col' = horizontal ? 'row' : 'col';
  const asc = dir === 'left' || dir === 'up';
  const result: Tile[] = [];
  const vanishing: Tile[] = [];
  let scoreGain = 0;
  let changed = false;

  for (let i = 0; i < GRID_SIZE; i++) {
    const line = lineFor(tiles, axis, i, asc);
    let writePos = asc ? 0 : GRID_SIZE - 1;
    let lastInResult: Tile | null = null;
    let lastMerged = false;

    for (const t of line) {
      if (lastInResult && !lastMerged && lastInResult.value === t.value) {
        // 合併:把上一個 tile 從 result 移除、放入 vanishing(它已在目的格)
        const idx = result.indexOf(lastInResult);
        if (idx >= 0) result.splice(idx, 1);
        vanishing.push(lastInResult);
        // 把當前 tile 也搬到同一格,放入 vanishing
        const targetRow = lastInResult.row;
        const targetCol = lastInResult.col;
        vanishing.push({
          ...t,
          row: targetRow,
          col: targetCol,
          isNew: false,
          isMerged: false,
        });
        // 新增合併後 tile(會壓在兩個 vanishing 之上,動畫期 z-order 自然在前)
        const merged: Tile = {
          id: makeId(),
          value: t.value * 2,
          row: targetRow,
          col: targetCol,
          isMerged: true,
        };
        result.push(merged);
        scoreGain += merged.value;
        changed = true;
        lastInResult = null;
        lastMerged = true;
        continue;
      }

      // 一般落位
      const newRow = horizontal ? i : writePos;
      const newCol = horizontal ? writePos : i;
      if (newRow !== t.row || newCol !== t.col) changed = true;
      const moved: Tile = {
        ...t,
        row: newRow,
        col: newCol,
        isNew: false,
        isMerged: false,
      };
      result.push(moved);
      lastInResult = moved;
      lastMerged = false;
      writePos = asc ? writePos + 1 : writePos - 1;
    }
  }

  return { tiles: result, vanishing, scoreGain, changed };
}

/** 棋盤已滿且無相鄰同值對 → 沒得動了 */
function isGameOver(tiles: ReadonlyArray<Tile>): boolean {
  if (tiles.length < GRID_SIZE * GRID_SIZE) return false;
  const grid: Array<Array<number>> = Array.from({ length: GRID_SIZE }, () =>
    Array<number>(GRID_SIZE).fill(0),
  );
  for (const t of tiles) {
    const row = grid[t.row];
    if (row) row[t.col] = t.value;
  }
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cur = grid[r]?.[c] ?? 0;
      if (c + 1 < GRID_SIZE && cur === (grid[r]?.[c + 1] ?? 0)) return false;
      if (r + 1 < GRID_SIZE && cur === (grid[r + 1]?.[c] ?? 0)) return false;
    }
  }
  return true;
}

export function createInitialState(): Game2048State {
  // 初始兩顆 tile,不顯示「new」動畫(避免一開始就閃)
  const tiles: Tile[] = [];
  const a = spawnTile(tiles, false);
  if (a) tiles.push(a);
  const b = spawnTile(tiles, false);
  if (b) tiles.push(b);
  return {
    status: 'playing',
    tiles,
    vanishing: [],
    score: 0,
    maxValue: tiles.reduce((m, t) => Math.max(m, t.value), 0),
    reached2048: false,
    continued: false,
    moves: 0,
  };
}

export function applyMove(state: Game2048State, dir: Direction): Game2048State {
  if (state.status !== 'playing') return state;
  const out = slide(state.tiles, dir);
  if (!out.changed) return state;
  const spawn = spawnTile(out.tiles);
  const tiles = spawn ? [...out.tiles, spawn] : out.tiles;
  const maxValue = tiles.reduce((m, t) => Math.max(m, t.value), 0);
  const reached = state.reached2048 || maxValue >= 2048;
  const over = isGameOver(tiles);
  return {
    ...state,
    tiles,
    vanishing: out.vanishing,
    score: state.score + out.scoreGain,
    moves: state.moves + 1,
    maxValue,
    reached2048: reached,
    status: over ? 'gameOver' : 'playing',
  };
}
