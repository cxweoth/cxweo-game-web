// 推箱子 — 純規則邏輯
//
// 解析字串地圖 → LevelStatic + 初始 Dynamic;
// move(static, dyn, dir) 回傳新 dynamic 或 null(撞牆 / 推不動)。

import {
  KEY,
  type Direction,
  type Dynamic,
  type LevelMeta,
  type LevelStatic,
  type StaticCell,
} from './types';

const DIR_VEC: Record<Direction, { dr: number; dc: number }> = {
  up: { dr: -1, dc: 0 },
  down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
  right: { dr: 0, dc: 1 },
};

/** 解析字串 map → static + initial dynamic */
export function parseLevel(meta: LevelMeta): { stat: LevelStatic; dyn: Dynamic } {
  const lines = meta.map.split('\n');
  const rows = lines.length;
  let cols = 0;
  for (const ln of lines) cols = Math.max(cols, ln.length);

  const cells: StaticCell[] = new Array(rows * cols).fill('void');
  const goals = new Set<string>();
  const boxes = new Set<string>();
  let player = { r: 0, c: 0 };

  for (let r = 0; r < rows; r++) {
    const line = lines[r] ?? '';
    for (let c = 0; c < cols; c++) {
      const ch = line[c] ?? ' ';
      const idx = r * cols + c;
      switch (ch) {
        case '#':
          cells[idx] = 'wall';
          break;
        case ' ':
        case '_':
          // 內部空白 → 地板;最外圈空白會在後處理留作 void(連通性 floodfill)
          cells[idx] = 'floor';
          break;
        case '.':
          cells[idx] = 'goal';
          goals.add(KEY(r, c));
          break;
        case '$':
          cells[idx] = 'floor';
          boxes.add(KEY(r, c));
          break;
        case '*':
          cells[idx] = 'goal';
          goals.add(KEY(r, c));
          boxes.add(KEY(r, c));
          break;
        case '@':
          cells[idx] = 'floor';
          player = { r, c };
          break;
        case '+':
          cells[idx] = 'goal';
          goals.add(KEY(r, c));
          player = { r, c };
          break;
        default:
          cells[idx] = 'void';
      }
    }
  }

  // 從外圍把所有 floor 連通到外的標回 void。
  // 簡化:floodfill 從邊界開始,只穿過 cell==='void' 的格子。
  // 這裡的 map 都用 # 把內部圍起來,所以原本 void 的標記就足夠了。

  return {
    stat: { rows, cols, cells, initialPlayer: player, initialBoxes: new Set(boxes), goals },
    dyn: { player, boxes },
  };
}

export function staticAt(stat: LevelStatic, r: number, c: number): StaticCell {
  if (r < 0 || r >= stat.rows || c < 0 || c >= stat.cols) return 'void';
  return stat.cells[r * stat.cols + c] ?? 'void';
}

/** 嘗試移動;成功回新 dyn,失敗(撞牆 / 推不動)回 null */
export function tryMove(
  stat: LevelStatic,
  dyn: Dynamic,
  dir: Direction,
): Dynamic | null {
  const { dr, dc } = DIR_VEC[dir];
  const nr = dyn.player.r + dr;
  const nc = dyn.player.c + dc;
  const target = staticAt(stat, nr, nc);
  if (target === 'wall' || target === 'void') return null;

  const nextKey = KEY(nr, nc);
  if (dyn.boxes.has(nextKey)) {
    // 試推:確認再下一格可放
    const br = nr + dr;
    const bc = nc + dc;
    const beyond = staticAt(stat, br, bc);
    if (beyond === 'wall' || beyond === 'void') return null;
    if (dyn.boxes.has(KEY(br, bc))) return null; // 不能推兩顆
    const nextBoxes = new Set(dyn.boxes);
    nextBoxes.delete(nextKey);
    nextBoxes.add(KEY(br, bc));
    return { player: { r: nr, c: nc }, boxes: nextBoxes };
  }

  // 純走步
  return { player: { r: nr, c: nc }, boxes: dyn.boxes };
}

/** 所有箱子都在 goal 上 → 過關 */
export function isCleared(stat: LevelStatic, dyn: Dynamic): boolean {
  if (dyn.boxes.size !== stat.goals.size) return false;
  for (const k of dyn.boxes) {
    if (!stat.goals.has(k)) return false;
  }
  return true;
}
