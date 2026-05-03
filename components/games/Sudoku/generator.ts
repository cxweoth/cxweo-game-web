// 數獨 — 題目生成
//
// 流程:
//   1) 從「規範解」打散得到一張隨機合法解(快,不需要 backtracking)
//   2) 隨機順序逐格挖洞,每挖一對對稱格(180°)就用 solveCount 檢查唯一解
//      — 不唯一就還原。挖到目標 clue 數或卡住為止。
//
// 為什麼不用「空盤 + backtracking 隨機填」生成解:那種 worst-case 指數時間,
// 用規範解 + 對稱打散是 O(81),穩定快很多。

import { solveCount } from './solver';
import { CELLS, DIFF_CLUES, SIZE, type Board, type Difficulty } from './types';

function shuffleArray<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

/**
 * 規範解模式:cell(r,c) = ((r % 3) * 3 + Math.floor(r / 3) + c) % 9 + 1
 * 數學上保證每列、每欄、每宮各出現 1..9 一次。
 */
function canonicalSolved(): Board {
  const b: Board = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      b.push(((((r % 3) * 3) + Math.floor(r / 3) + c) % 9) + 1);
    }
  }
  return b;
}

/** 列序列重排成 newOrder(長度 9) */
function permuteRows(b: Board, newOrder: number[]): Board {
  const out: Board = new Array(CELLS);
  for (let r = 0; r < SIZE; r++) {
    const src = newOrder[r]! * SIZE;
    const dst = r * SIZE;
    for (let c = 0; c < SIZE; c++) out[dst + c] = b[src + c]!;
  }
  return out;
}
function permuteCols(b: Board, newOrder: number[]): Board {
  const out: Board = new Array(CELLS);
  for (let r = 0; r < SIZE; r++) {
    const dst = r * SIZE;
    const src = r * SIZE;
    for (let c = 0; c < SIZE; c++) out[dst + c] = b[src + newOrder[c]!]!;
  }
  return out;
}

/** 把 1..9 數字換上隨機字母(等同重新標籤,不影響合法性) */
function relabel(b: Board): Board {
  const perm = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  return b.map((v) => (v ? perm[v - 1]! : 0));
}

/** 產生隨機合法的「滿盤解」 */
export function generateSolved(): Board {
  let b = canonicalSolved();
  // 1) 列換:三個帶(band)各自三列洗;再把三個帶整體洗
  for (let band = 0; band < 3; band++) {
    const order = shuffleArray([0, 1, 2]).map((x) => band * 3 + x);
    const newOrder = [...Array(SIZE).keys()];
    for (let i = 0; i < 3; i++) newOrder[band * 3 + i] = order[i]!;
    b = permuteRows(b, newOrder);
  }
  const bandOrder = shuffleArray([0, 1, 2]);
  {
    const newOrder: number[] = [];
    for (const bk of bandOrder) {
      for (let i = 0; i < 3; i++) newOrder.push(bk * 3 + i);
    }
    b = permuteRows(b, newOrder);
  }
  // 2) 欄換(同上,但對 col)
  for (let stack = 0; stack < 3; stack++) {
    const order = shuffleArray([0, 1, 2]).map((x) => stack * 3 + x);
    const newOrder = [...Array(SIZE).keys()];
    for (let i = 0; i < 3; i++) newOrder[stack * 3 + i] = order[i]!;
    b = permuteCols(b, newOrder);
  }
  const stackOrder = shuffleArray([0, 1, 2]);
  {
    const newOrder: number[] = [];
    for (const sk of stackOrder) {
      for (let i = 0; i < 3; i++) newOrder.push(sk * 3 + i);
    }
    b = permuteCols(b, newOrder);
  }
  // 3) 隨機重新標籤 1..9
  b = relabel(b);
  return b;
}

/**
 * 從滿盤解開始,逐對對稱挖空格至目標 clue 數;
 * 每次嘗試挖洞後 solveCount(limit=2),非唯一解就還原。
 *
 * targetClues 是「希望剩多少格」;若挖不到目標(困難難度可能),回傳當前最佳。
 */
function carvePuzzle(solved: Board, targetClues: number): Board {
  const board = solved.slice();
  const order = shuffleArray([...Array(CELLS).keys()]);
  let cluesRemain = CELLS;

  for (const i of order) {
    if (cluesRemain <= targetClues) break;
    const sym = CELLS - 1 - i; // 180° 對稱
    const v1 = board[i]!;
    const v2 = board[sym]!;
    if (v1 === 0) continue;

    board[i] = 0;
    let didSym = false;
    if (sym !== i && v2 !== 0) {
      board[sym] = 0;
      didSym = true;
    }
    const { count } = solveCount(board, 2);
    if (count !== 1) {
      board[i] = v1;
      if (didSym) board[sym] = v2;
    } else {
      cluesRemain -= didSym ? 2 : 1;
    }
  }
  return board;
}

/**
 * 主入口:依難度回傳 { puzzle, solution }。
 * 注意 solver 是隨機的(MRV 但同候選數列舉順序固定 1..9),
 * 同盤面同 limit 解出來的 first 解一致;這裡直接信任 solved 為唯一解 ≡ 答案。
 */
export function generatePuzzle(diff: Difficulty): { puzzle: Board; solution: Board } {
  const solution = generateSolved();
  const target = DIFF_CLUES[diff];
  // 困難難度多嘗試一次,挖更乾淨
  let best = carvePuzzle(solution, target);
  if (diff === 'expert' || diff === 'hard') {
    for (let attempt = 0; attempt < 2; attempt++) {
      const b = carvePuzzle(solution, target);
      const cb = b.filter((v) => v).length;
      const cBest = best.filter((v) => v).length;
      if (cb < cBest) best = b;
    }
  }
  return { puzzle: best, solution };
}
