'use client';

import { useEffect, useReducer, useState } from 'react';
import { clamp, randomInt } from '@/lib/utils';
import {
  DIFFICULTIES,
  type Action,
  type Board,
  type Cell,
  type Difficulty,
  type MinesweeperState,
} from './types';

// --- 純函式 ---

function emptyCell(): Cell {
  return { isMine: false, isRevealed: false, isFlagged: false, adjacent: 0, isExploded: false };
}

function createBoard(rows: number, cols: number): Board {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => emptyCell()),
  );
}

/** 8 鄰偏移；flood fill 與計算 adjacent 共用 */
const NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

function at(board: Board, r: number, c: number): Cell | undefined {
  return board[r]?.[c];
}

/**
 * 在首擊後布雷：避開點到的 (safeR, safeC) 與其 8 鄰，確保首擊能開出一小片。
 * 同時計算每格的 adjacent。
 */
function placeMines(
  rows: number,
  cols: number,
  mineCount: number,
  safeR: number,
  safeC: number,
): Board {
  const board = createBoard(rows, cols);
  const forbidden = new Set<number>();
  for (const [dr, dc] of NEIGHBORS) {
    forbidden.add((safeR + dr) * cols + (safeC + dc));
  }
  forbidden.add(safeR * cols + safeC);

  // 可用於放雷的位置池
  const pool: number[] = [];
  for (let i = 0; i < rows * cols; i++) {
    if (!forbidden.has(i)) pool.push(i);
  }

  // Fisher–Yates 抽樣前 mineCount 個
  const effective = Math.min(mineCount, pool.length);
  for (let i = 0; i < effective; i++) {
    const j = randomInt(i, pool.length - 1);
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }

  for (let k = 0; k < effective; k++) {
    const idx = pool[k]!;
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    const cell = board[r]![c]!;
    cell.isMine = true;
  }

  // 計算 adjacent
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r]![c]!;
      if (cell.isMine) continue;
      let count = 0;
      for (const [dr, dc] of NEIGHBORS) {
        if (at(board, r + dr, c + dc)?.isMine) count++;
      }
      cell.adjacent = count;
    }
  }

  return board;
}

/** BFS 展開 0 值連通區（含邊界的數字格）。回傳新翻開格數。 */
function floodReveal(board: Board, startR: number, startC: number): number {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const queue: Array<[number, number]> = [[startR, startC]];
  let revealed = 0;

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const cell = at(board, r, c);
    if (!cell || cell.isRevealed || cell.isFlagged || cell.isMine) continue;
    cell.isRevealed = true;
    revealed++;
    if (cell.adjacent === 0) {
      for (const [dr, dc] of NEIGHBORS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        queue.push([nr, nc]);
      }
    }
  }
  return revealed;
}

/** 踩雷結算：所有地雷翻出（已插旗的保留旗子外觀） */
function revealAllMines(board: Board): void {
  for (const row of board) {
    for (const cell of row) {
      if (cell.isMine && !cell.isFlagged) cell.isRevealed = true;
    }
  }
}

/** 深拷貝整個 board（reducer 內不可改舊 state） */
function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

// --- 初始 state ---

function init(difficulty: Difficulty): MinesweeperState {
  const cfg = DIFFICULTIES[difficulty];
  return {
    difficulty,
    status: 'idle',
    board: createBoard(cfg.rows, cfg.cols),
    flags: 0,
    revealed: 0,
    cursor: { r: 0, c: 0 },
    startedAt: null,
    endedAt: null,
    mined: false,
  };
}

// --- Reducer ---

function reducer(state: MinesweeperState, action: Action): MinesweeperState {
  switch (action.type) {
    case 'restart':
      return init(action.difficulty ?? state.difficulty);

    case 'moveCursor': {
      if (state.status === 'gameOver') return state;
      const cfg = DIFFICULTIES[state.difficulty];
      const r = clamp(state.cursor.r + action.dr, 0, cfg.rows - 1);
      const c = clamp(state.cursor.c + action.dc, 0, cfg.cols - 1);
      if (r === state.cursor.r && c === state.cursor.c) return state;
      return { ...state, cursor: { r, c } };
    }

    case 'flag': {
      if (state.status === 'gameOver') return state;
      const cell = at(state.board, action.r, action.c);
      if (!cell || cell.isRevealed) return state;
      const board = cloneBoard(state.board);
      const target = board[action.r]![action.c]!;
      target.isFlagged = !target.isFlagged;
      return {
        ...state,
        board,
        flags: state.flags + (target.isFlagged ? 1 : -1),
        cursor: { r: action.r, c: action.c },
      };
    }

    case 'reveal': {
      if (state.status === 'gameOver') return state;
      const originalCell = at(state.board, action.r, action.c);
      if (!originalCell || originalCell.isRevealed || originalCell.isFlagged) return state;

      const cfg = DIFFICULTIES[state.difficulty];

      // 首擊：布雷並啟動計時
      let board = state.mined
        ? cloneBoard(state.board)
        : placeMines(cfg.rows, cfg.cols, cfg.mines, action.r, action.c);
      const justStarted = !state.mined;

      const target = board[action.r]![action.c]!;

      // 踩到地雷 → 失敗
      if (target.isMine) {
        target.isExploded = true;
        revealAllMines(board);
        return {
          ...state,
          board,
          mined: true,
          status: 'gameOver',
          startedAt: justStarted ? Date.now() : state.startedAt,
          endedAt: Date.now(),
          cursor: { r: action.r, c: action.c },
        };
      }

      // 正常翻開（可能觸發 flood fill）
      const newlyRevealed = floodReveal(board, action.r, action.c);
      const totalRevealed = state.revealed + newlyRevealed;
      const needed = cfg.rows * cfg.cols - cfg.mines;
      const won = totalRevealed >= needed;

      // 勝利時把所有未插旗的雷自動插上（經典踩地雷表現）
      let flags = state.flags;
      if (won) {
        for (const row of board) {
          for (const cell of row) {
            if (cell.isMine && !cell.isFlagged) {
              cell.isFlagged = true;
              flags++;
            }
          }
        }
      }

      const now = Date.now();
      return {
        ...state,
        board,
        mined: true,
        revealed: totalRevealed,
        flags,
        status: won ? 'gameOver' : 'playing',
        startedAt: justStarted ? now : state.startedAt,
        endedAt: won ? now : null,
        cursor: { r: action.r, c: action.c },
      };
    }

    default:
      return state;
  }
}

// --- Public hook ---

export function useMinesweeper(initialDifficulty: Difficulty = 'easy') {
  const [state, dispatch] = useReducer(reducer, initialDifficulty, init);

  // UI 用時間戳：每 250ms tick 一次，讓分秒跳動順暢。
  // 不是遊戲主迴圈；是單純的計時 UI 更新（CLAUDE.md 禁用 setInterval 的是動畫主迴圈）。
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    if (state.status !== 'playing') return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [state.status]);

  const elapsed = state.startedAt
    ? Math.floor(
        ((state.status === 'gameOver' && state.endedAt
          ? state.endedAt
          : now) -
          state.startedAt) /
          1000,
      )
    : 0;

  const cfg = DIFFICULTIES[state.difficulty];
  const isWin =
    state.status === 'gameOver' &&
    state.revealed === cfg.rows * cfg.cols - cfg.mines;

  return {
    state,
    elapsed,
    config: cfg,
    isWin,
    reveal: (r: number, c: number) => dispatch({ type: 'reveal', r, c }),
    flag: (r: number, c: number) => dispatch({ type: 'flag', r, c }),
    moveCursor: (dr: number, dc: number) =>
      dispatch({ type: 'moveCursor', dr, dc }),
    restart: (difficulty?: Difficulty) =>
      dispatch({ type: 'restart', difficulty }),
  };
}
