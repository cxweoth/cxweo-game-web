// 連線四子 — minimax + alpha-beta 剪枝 AI
//
// 評估函數:用「4 格視窗」的同色 / 對手色含量打分。
// 中央列加權鼓勵 AI 站中央(連線威脅最多)。

import {
  COLS,
  ROWS,
  WIN,
  indexOf,
  opponent,
  type Board,
  type Player,
} from './types';
import { dropPiece, findWin, isDraw, legalCols, lowestEmptyRow } from './logic';

const WIN_SCORE = 1_000_000;

/** 對 4 連視窗打分:依 player / opp 數量回 +/- */
function windowScore(window: number[], player: Player): number {
  const opp = opponent(player);
  let me = 0;
  let foe = 0;
  let empty = 0;
  for (const v of window) {
    if (v === player) me++;
    else if (v === opp) foe++;
    else empty++;
  }
  if (me === 4) return 100_000;
  if (foe === 4) return -100_000;
  if (me === 3 && empty === 1) return 100;
  if (me === 2 && empty === 2) return 10;
  if (foe === 3 && empty === 1) return -120; // 對手 3 連微加權,優先擋
  if (foe === 2 && empty === 2) return -8;
  return 0;
}

/** 啟發式評估:遍歷所有 4 連視窗 + 中央加權 */
function evaluate(board: Board, player: Player): number {
  let score = 0;

  // 中央列加權
  const centerCol = Math.floor(COLS / 2);
  let centerCount = 0;
  for (let r = 0; r < ROWS; r++) {
    if (board[indexOf(r, centerCol)] === player) centerCount++;
  }
  score += centerCount * 6;

  // 橫向
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - WIN; c++) {
      const w = [
        board[indexOf(r, c)]!,
        board[indexOf(r, c + 1)]!,
        board[indexOf(r, c + 2)]!,
        board[indexOf(r, c + 3)]!,
      ];
      score += windowScore(w, player);
    }
  }
  // 直向
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - WIN; r++) {
      const w = [
        board[indexOf(r, c)]!,
        board[indexOf(r + 1, c)]!,
        board[indexOf(r + 2, c)]!,
        board[indexOf(r + 3, c)]!,
      ];
      score += windowScore(w, player);
    }
  }
  // 主對角
  for (let r = 0; r <= ROWS - WIN; r++) {
    for (let c = 0; c <= COLS - WIN; c++) {
      const w = [
        board[indexOf(r, c)]!,
        board[indexOf(r + 1, c + 1)]!,
        board[indexOf(r + 2, c + 2)]!,
        board[indexOf(r + 3, c + 3)]!,
      ];
      score += windowScore(w, player);
    }
  }
  // 反對角
  for (let r = 0; r <= ROWS - WIN; r++) {
    for (let c = WIN - 1; c < COLS; c++) {
      const w = [
        board[indexOf(r, c)]!,
        board[indexOf(r + 1, c - 1)]!,
        board[indexOf(r + 2, c - 2)]!,
        board[indexOf(r + 3, c - 3)]!,
      ];
      score += windowScore(w, player);
    }
  }
  return score;
}

/** 從中央往兩側排序,提高 alpha-beta 剪枝效率 */
function orderColumns(board: Board): number[] {
  const center = Math.floor(COLS / 2);
  const order: number[] = [];
  for (let off = 0; off < COLS; off++) {
    for (const sign of off === 0 ? [0] : [-1, 1]) {
      const c = center + sign * off;
      if (c >= 0 && c < COLS) order.push(c);
    }
  }
  // 過濾滿欄
  return order.filter((c) => lowestEmptyRow(board, c) !== -1);
}

type SearchResult = { score: number; col: number };

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  aiPlayer: Player,
): SearchResult {
  const win = findWin(board);
  if (win) {
    const winnerIsAi = win.winner === aiPlayer;
    return { score: winnerIsAi ? WIN_SCORE - (10 - depth) : -WIN_SCORE + (10 - depth), col: -1 };
  }
  if (isDraw(board)) return { score: 0, col: -1 };
  if (depth === 0) {
    return { score: evaluate(board, aiPlayer), col: -1 };
  }

  const player: Player = maximizing ? aiPlayer : opponent(aiPlayer);
  const cols = orderColumns(board);
  let bestCol = cols[0] ?? -1;
  let bestScore = maximizing ? -Infinity : Infinity;

  for (const c of cols) {
    const r = dropPiece(board, c, player);
    if (!r) continue;
    const child = minimax(r.board, depth - 1, alpha, beta, !maximizing, aiPlayer);
    if (maximizing) {
      if (child.score > bestScore) {
        bestScore = child.score;
        bestCol = c;
      }
      alpha = Math.max(alpha, bestScore);
    } else {
      if (child.score < bestScore) {
        bestScore = child.score;
        bestCol = c;
      }
      beta = Math.min(beta, bestScore);
    }
    if (alpha >= beta) break; // 剪枝
  }

  return { score: bestScore, col: bestCol };
}

/** 主入口:回傳該下哪一欄;沒合法步回 −1 */
export function chooseAiColumn(board: Board, aiPlayer: Player, depth: number): number {
  const cols = legalCols(board);
  if (cols.length === 0) return -1;
  // 先處理快速勝/必擋:避免 minimax 在低深度看不到致勝步
  for (const c of cols) {
    const r = dropPiece(board, c, aiPlayer);
    if (r && findWin(r.board)) return c;
  }
  for (const c of cols) {
    const r = dropPiece(board, c, opponent(aiPlayer));
    if (r && findWin(r.board)) return c; // 玩家下一步會贏 → 擋
  }
  const { col } = minimax(board, depth, -Infinity, Infinity, true, aiPlayer);
  return col === -1 ? cols[Math.floor(cols.length / 2)]! : col;
}
