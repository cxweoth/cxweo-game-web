// 啟發式五子棋 AI — 單層評估。
//
// 思路：對每個「候選空格」同時算兩個分數
//   - 攻擊分：把 AI 的子放上去會產生什麼棋型？
//   - 防守分：如果對手把他的子放到這裡會產生什麼棋型？
//   → 取兩者加權和最大者落子。
//
// 候選空格只限定在「已有棋子周圍 2 格內」，顯著加速且不影響棋力。
//
// 這種一層評估無法預讀多步，但對新手來說已有明顯棋感：
// 會主動組活三、活四，會防對手的衝四 / 活四。

import { BOARD_SIZE, type Board, type Color } from './types';

type Dir = readonly [number, number];
const DIRS: ReadonlyArray<Dir> = [
  [0, 1],  // 水平
  [1, 0],  // 垂直
  [1, 1],  // 對角 ↘
  [1, -1], // 對角 ↗
];

function inRange(r: number, c: number): boolean {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

function cellAt(board: Board, r: number, c: number): Color | null | undefined {
  return board[r]?.[c];
}

/**
 * 在 (r, c) 假設放下 color 後，沿 dir 方向計算連子數與兩端是否開放。
 * `count` 包含 (r, c) 自身。
 */
function countLine(
  board: Board,
  r: number,
  c: number,
  color: Color,
  [dr, dc]: Dir,
): { count: number; openHead: boolean; openTail: boolean } {
  let count = 1;
  let headR = r - dr;
  let headC = c - dc;
  while (inRange(headR, headC) && cellAt(board, headR, headC) === color) {
    count++;
    headR -= dr;
    headC -= dc;
  }
  const openHead = inRange(headR, headC) && cellAt(board, headR, headC) === null;

  let tailR = r + dr;
  let tailC = c + dc;
  while (inRange(tailR, tailC) && cellAt(board, tailR, tailC) === color) {
    count++;
    tailR += dr;
    tailC += dc;
  }
  const openTail = inRange(tailR, tailC) && cellAt(board, tailR, tailC) === null;

  return { count, openHead, openTail };
}

/** 依連子數與開放端給分 */
function scoreLine(count: number, openHead: boolean, openTail: boolean): number {
  if (count >= 5) return 1_000_000;
  const openEnds = (openHead ? 1 : 0) + (openTail ? 1 : 0);
  if (openEnds === 0) return 0; // 兩端都被堵，無威脅
  if (count === 4) return openEnds === 2 ? 100_000 : 10_000; // 活四 / 衝四
  if (count === 3) return openEnds === 2 ? 5_000 : 500;      // 活三 / 眠三
  if (count === 2) return openEnds === 2 ? 200 : 20;         // 活二 / 眠二
  if (count === 1) return openEnds === 2 ? 10 : 1;
  return 0;
}

/** 在 (r, c) 若落下 color，以 4 個方向加總得分 */
function evalPlace(board: Board, r: number, c: number, color: Color): number {
  let total = 0;
  for (const dir of DIRS) {
    const { count, openHead, openTail } = countLine(board, r, c, color, dir);
    total += scoreLine(count, openHead, openTail);
  }
  return total;
}

/** 所有候選格：任何空格只要附近 2 格內有任何棋子 */
function candidates(board: Board): Array<[number, number]> {
  const RADIUS = 2;
  const result: Array<[number, number]> = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r]![c] !== null) continue;
      let hasNeighbor = false;
      for (let dr = -RADIUS; dr <= RADIUS && !hasNeighbor; dr++) {
        for (let dc = -RADIUS; dc <= RADIUS && !hasNeighbor; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (inRange(nr, nc) && board[nr]![nc] !== null) hasNeighbor = true;
        }
      }
      if (hasNeighbor) result.push([r, c]);
    }
  }
  return result;
}

function isEmpty(board: Board): boolean {
  for (const row of board) for (const cell of row) if (cell !== null) return false;
  return true;
}

/** 對手顏色 */
function opposite(color: Color): Color {
  return color === 'black' ? 'white' : 'black';
}

/**
 * 回傳 AI 建議的下一步。若棋盤全空，直接下天元。
 * 防守權重稍高（1.1）讓 AI 略偏守，新手體感較合理。
 */
export function pickMove(board: Board, aiColor: Color): [number, number] {
  if (isEmpty(board)) return [Math.floor(BOARD_SIZE / 2), Math.floor(BOARD_SIZE / 2)];

  const oppColor = opposite(aiColor);
  const candList = candidates(board);
  if (candList.length === 0) {
    // 保險：找任何空格
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r]![c] === null) return [r, c];
      }
    }
    return [0, 0];
  }

  let bestScore = -Infinity;
  let best: [number, number] = candList[0]!;
  const DEFENSE_WEIGHT = 1.1;

  for (const [r, c] of candList) {
    const attack = evalPlace(board, r, c, aiColor);
    // 若這一步直接贏 / 防住對手致勝點 → 立刻優先
    if (attack >= 1_000_000) return [r, c];
    const defense = evalPlace(board, r, c, oppColor);
    if (defense >= 1_000_000) return [r, c];
    const total = attack + defense * DEFENSE_WEIGHT;
    if (total > bestScore) {
      bestScore = total;
      best = [r, c];
    }
  }
  return best;
}
