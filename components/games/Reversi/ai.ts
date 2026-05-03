// 黑白棋 — 簡易啟發式 AI
//
// 不做 minimax(避免拖累瀏覽器);用「位置權重 + 機動性 + 翻片數」的線性評估。
// 這樣強度大約勝過初學者、但會輸給有概念的人類,正好作為陪玩。

import { CELLS, SIZE } from './types';
import type { Board, Move, Player } from './types';
import { applyMove, legalMoves } from './logic';

/**
 * 經典位置權重表 — 角落極高、X 角(角斜對)極低。
 * 落在 X 角會把角拱手讓人,故設大的負分。
 */
// prettier-ignore
const WEIGHTS: number[] = [
  100, -25,  10,   5,   5,  10, -25, 100,
  -25, -50,   1,   1,   1,   1, -50, -25,
   10,   1,   5,   2,   2,   5,   1,  10,
    5,   1,   2,   1,   1,   2,   1,   5,
    5,   1,   2,   1,   1,   2,   1,   5,
   10,   1,   5,   2,   2,   5,   1,  10,
  -25, -50,   1,   1,   1,   1, -50, -25,
  100, -25,  10,   5,   5,  10, -25, 100,
];

const CORNERS = [0, SIZE - 1, CELLS - SIZE, CELLS - 1];

function isCornerOwned(board: Board, player: Player, idx: number): boolean {
  return CORNERS.includes(idx) && board[idx] === player;
}

/** 線性啟發式打分:位置權重 + 翻片數 + 對手機動性 */
function scoreMove(board: Board, move: Move, player: Player): number {
  const after = applyMove(board, move, player);

  // 位置分:用權重表為「我方棋子總和」
  let posScore = 0;
  for (let i = 0; i < CELLS; i++) {
    if (after[i] === player) posScore += WEIGHTS[i] ?? 0;
    else if (after[i] !== 0) posScore -= WEIGHTS[i] ?? 0;
  }

  // 機動性:對手能下的合法步越少越好
  const oppMoves = legalMoves(after, player === 1 ? 2 : 1).length;
  const mobility = -oppMoves * 4;

  // 翻片數加權(中盤略加,終盤直接看子數)
  const flipScore = move.flips.length;

  // 角落特權:若這步剛好佔角 +大量
  const cornerBonus = CORNERS.includes(move.index) ? 50 : 0;

  // 終盤(空位 ≤ 12)轉成「子數差」優先
  const empty = after.filter((c) => c === 0).length;
  if (empty <= 12) {
    const myCount = after.filter((c) => c === player).length;
    const oppCount = after.filter((c) => c === (player === 1 ? 2 : 1)).length;
    return (myCount - oppCount) * 4 + cornerBonus;
  }

  return posScore + mobility + flipScore + cornerBonus;
}

/**
 * 主入口:挑出當前最佳合法步。沒步回 null(呼叫端應 pass)。
 * 若多步同分,稍微隨機選一個避免每盤都一樣。
 */
export function chooseAiMove(board: Board, player: Player): Move | null {
  const moves = legalMoves(board, player);
  if (moves.length === 0) return null;

  let bestScore = -Infinity;
  let bestMoves: Move[] = [];
  for (const m of moves) {
    // 已佔角,而這步不是角 → 不該主動 X 角(由 WEIGHTS 處理)
    void isCornerOwned;
    const s = scoreMove(board, m, player);
    if (s > bestScore + 0.01) {
      bestScore = s;
      bestMoves = [m];
    } else if (Math.abs(s - bestScore) < 0.01) {
      bestMoves.push(m);
    }
  }
  const pickIdx = Math.floor(Math.random() * bestMoves.length);
  return bestMoves[pickIdx] ?? bestMoves[0] ?? null;
}
