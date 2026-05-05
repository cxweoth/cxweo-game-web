// 六貫棋 Hex — 啟發式 AI
//
// 核心:對每個空格估算「我下這裡」與「對手下這裡」對雙方最短連線距離的影響。
// 最短連線距離(shortest connection distance)定義:
//   - 自己色 cell-cost = 0(已占領,免費)
//   - 空格 cell-cost = 1(還需 1 手才能占領)
//   - 對手色 cell-cost = ∞(不可走)
//   - 從「源邊」可達到「目標邊」的最小總 cost = 還差幾手就能連通
// 用標準 Dijkstra(N²=121,V² 微秒級)實作。
//
// 額外:落子前先做單步 lookahead,(1) 我能一手贏 → 立刻下,(2) 對手下一手能贏 → 必擋。

import { applyMove, isWinFor } from './logic';
import {
  HEX_DIRS,
  inBounds,
  indexOf,
  opponent,
  rowCol,
  type Board,
  type Player,
} from './types';

const INF = 1e9;

/**
 * 計算 player 從源邊到目標邊的最短連線距離。
 * 已連通時回傳 0(代表已贏),完全不可達回傳 INF。
 */
export function shortestConnectionDist(board: Board, player: Player, n: number): number {
  const N = n * n;
  const opp = opponent(player);
  const dist = new Array<number>(N).fill(INF);
  const visited = new Uint8Array(N);

  const cellCost = (i: number): number => {
    const v = board[i];
    if (v === opp) return INF;
    if (v === player) return 0;
    return 1;
  };

  // 源邊初始化
  if (player === 1) {
    for (let c = 0; c < n; c++) {
      const i = indexOf(0, c, n);
      const cc = cellCost(i);
      if (cc < INF) dist[i] = cc;
    }
  } else {
    for (let r = 0; r < n; r++) {
      const i = indexOf(r, 0, n);
      const cc = cellCost(i);
      if (cc < INF) dist[i] = cc;
    }
  }

  // 樸素 Dijkstra(N=121,O(V²) 已綽綽有餘)
  for (let iter = 0; iter < N; iter++) {
    let u = -1;
    let bestD = INF;
    for (let i = 0; i < N; i++) {
      if (!visited[i] && dist[i]! < bestD) {
        bestD = dist[i]!;
        u = i;
      }
    }
    if (u === -1) break;
    visited[u] = 1;
    const { row, col } = rowCol(u, n);
    for (const [dr, dc] of HEX_DIRS) {
      const nr = row + dr;
      const nc = col + dc;
      if (!inBounds(nr, nc, n)) continue;
      const v = indexOf(nr, nc, n);
      const cc = cellCost(v);
      if (cc === INF) continue;
      const newD = dist[u]! + cc;
      if (newD < dist[v]!) dist[v] = newD;
    }
  }

  // 目標邊最小值
  let best = INF;
  if (player === 1) {
    for (let c = 0; c < n; c++) {
      const d = dist[indexOf(n - 1, c, n)]!;
      if (d < best) best = d;
    }
  } else {
    for (let r = 0; r < n; r++) {
      const d = dist[indexOf(r, n - 1, n)]!;
      if (d < best) best = d;
    }
  }
  return best;
}

/**
 * 主入口:選一步落子。
 *
 * 1. 開局空盤:下中央(經典最強起手,Pie 規則會讓白方判斷是否要 swap)
 * 2. 我能一手贏 → 立刻下
 * 3. 對手下一手能贏 → 必擋(若有多個必擋點,選 score 最高者)
 * 4. 否則枚舉所有空格,計算 score = oppDistIfOppPlays - selfDistIfIPlay
 *    分數越高越好(縮短自己連線 + 拉長對手連線)。
 *    多步同分隨機選一個避免每盤都一樣。
 */
export function chooseAiMove(board: Board, player: Player, n: number): number | null {
  const opp = opponent(player);
  const empty: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === 0) empty.push(i);
  }
  if (empty.length === 0) return null;

  // 1. 開局空盤 → 中央
  if (empty.length === n * n) {
    const mid = Math.floor(n / 2);
    return indexOf(mid, mid, n);
  }

  // 2. 我能一手贏
  for (const idx of empty) {
    const after = applyMove(board, idx, player);
    if (isWinFor(after, player, n)) return idx;
  }

  // 3. 對手下一手能贏 → 必擋
  const mustBlock: number[] = [];
  for (const idx of empty) {
    const after = applyMove(board, idx, opp);
    if (isWinFor(after, opp, n)) mustBlock.push(idx);
  }

  // 4. 啟發式評分
  const candidates = mustBlock.length > 0 ? mustBlock : empty;
  let bestScore = -INF;
  let bestMoves: number[] = [];
  for (const idx of candidates) {
    const ifMine = applyMove(board, idx, player);
    const selfDist = shortestConnectionDist(ifMine, player, n);
    const ifOpps = applyMove(board, idx, opp);
    const oppDist = shortestConnectionDist(ifOpps, opp, n);
    const score = oppDist - selfDist;
    if (score > bestScore + 0.001) {
      bestScore = score;
      bestMoves = [idx];
    } else if (Math.abs(score - bestScore) < 0.001) {
      bestMoves.push(idx);
    }
  }
  const pick = bestMoves[Math.floor(Math.random() * bestMoves.length)];
  return pick ?? candidates[0] ?? null;
}

/**
 * Pie 規則用:評估第一手是否「強到應該 swap」。
 * 若該位置被假設為白色,白方距離 ≤ 黑方原本距離 + 1 → 偏強 → swap。
 * 簡化判斷:只要第一手不是邊角(離中心很近),swap 通常較好。
 */
export function shouldSwap(firstMoveIdx: number, n: number): boolean {
  const { row, col } = rowCol(firstMoveIdx, n);
  const mid = (n - 1) / 2;
  const distFromCenter = Math.max(Math.abs(row - mid), Math.abs(col - mid));
  // 中央 3×3 區域(以 N=11 為例,離中心 ≤ 1.5 格)→ 第一手太強,該 swap
  return distFromCenter <= Math.floor(n / 4);
}
