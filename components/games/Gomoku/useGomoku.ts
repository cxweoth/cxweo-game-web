'use client';

import { useEffect, useReducer, useRef } from 'react';
import { clamp } from '@/lib/utils';
import { pickMove } from './ai';
import {
  BOARD_SIZE,
  defaultPrefs,
  type Action,
  type Board,
  type Cell,
  type Color,
  type GomokuState,
  type GomokuPrefs,
  type Move,
  type Winner,
} from './types';

// --- 純函式 ---

function createBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null as Cell),
  );
}

function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice());
}

function opposite(color: Color): Color {
  return color === 'black' ? 'white' : 'black';
}

const WIN_DIRS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 0], [1, 1], [1, -1],
];

/** 落子後判定：若構成 ≥5 連子，回傳完整連線座標（用於高亮） */
function findWinLine(
  board: Board,
  r: number,
  c: number,
  color: Color,
): ReadonlyArray<readonly [number, number]> | null {
  for (const [dr, dc] of WIN_DIRS) {
    const line: Array<[number, number]> = [[r, c]];
    // 正向
    for (let i = 1; board[r + dr * i]?.[c + dc * i] === color; i++) {
      line.push([r + dr * i, c + dc * i]);
    }
    // 反向
    for (let i = 1; board[r - dr * i]?.[c - dc * i] === color; i++) {
      line.unshift([r - dr * i, c - dc * i]);
    }
    if (line.length >= 5) return line;
  }
  return null;
}

function boardFull(board: Board): boolean {
  for (const row of board) for (const cell of row) if (cell === null) return false;
  return true;
}

// --- 初始 state ---

function init(prefs: GomokuPrefs = defaultPrefs): GomokuState {
  return {
    board: createBoard(),
    history: [],
    turn: 'black',
    mode: prefs.mode,
    humanSide: prefs.humanSide,
    winner: null,
    winLine: null,
    cursor: { r: Math.floor(BOARD_SIZE / 2), c: Math.floor(BOARD_SIZE / 2) },
  };
}

// --- Reducer ---

function reducer(state: GomokuState, action: Action): GomokuState {
  switch (action.type) {
    case 'restart':
      return {
        ...init({ mode: state.mode, humanSide: state.humanSide }),
      };

    case 'setMode': {
      const humanSide = action.humanSide ?? state.humanSide;
      // 切換模式時重開一局，避免中途切換造成邏輯混亂
      return {
        ...init({ mode: action.mode, humanSide }),
      };
    }

    case 'moveCursor': {
      if (state.winner !== null) return state;
      const r = clamp(state.cursor.r + action.dr, 0, BOARD_SIZE - 1);
      const c = clamp(state.cursor.c + action.dc, 0, BOARD_SIZE - 1);
      if (r === state.cursor.r && c === state.cursor.c) return state;
      return { ...state, cursor: { r, c } };
    }

    case 'play': {
      if (state.winner !== null) return state;
      const { r, c } = action;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return state;
      if (state.board[r]?.[c] !== null) return state;

      const color = state.turn;
      const board = cloneBoard(state.board);
      board[r]![c] = color;

      const winLine = findWinLine(board, r, c, color);
      const move: Move = { r, c, color };
      const history = [...state.history, move];

      let winner: Winner = state.winner;
      if (winLine) winner = color;
      else if (boardFull(board)) winner = 'draw';

      return {
        ...state,
        board,
        history,
        turn: opposite(color),
        winner,
        winLine,
        cursor: { r, c },
      };
    }

    case 'undo': {
      if (state.history.length === 0) return state;
      // AI 模式下，若上一手是 AI 下的，連同玩家前一手一起悔（悔 2 步）
      const popCount =
        state.mode === 'ai' &&
        state.history.length >= 2 &&
        state.history[state.history.length - 1]!.color !== state.humanSide
          ? 2
          : 1;

      const history = state.history.slice(0, state.history.length - popCount);
      const board = createBoard();
      for (const m of history) board[m.r]![m.c] = m.color;
      const nextTurn: Color =
        history.length === 0 ? 'black' : opposite(history[history.length - 1]!.color);

      return {
        ...state,
        board,
        history,
        turn: nextTurn,
        winner: null,
        winLine: null,
      };
    }

    default:
      return state;
  }
}

// --- Hook ---

/**
 * 初始偏好由外部（Gomoku.tsx）從 localStorage 讀取後傳入。
 * AI 自動回應寫在 useEffect 裡：當輪到 AI 且無勝負時，延遲落子。
 */
export function useGomoku(initialPrefs: GomokuPrefs = defaultPrefs) {
  const [state, dispatch] = useReducer(reducer, initialPrefs, init);

  // AI 落子（只有 mode=ai 時觸發）。用 ref 存 timeout 以便 cleanup。
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (state.mode !== 'ai') return;
    if (state.winner !== null) return;
    if (state.turn === state.humanSide) return;

    // 思考延遲（ms）— 讓出手不會顯得機械
    const delay = state.history.length === 0 ? 200 : 350;
    timerRef.current = window.setTimeout(() => {
      const [r, c] = pickMove(state.board, state.turn);
      dispatch({ type: 'play', r, c });
    }, delay);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.mode, state.winner, state.turn, state.humanSide, state.board, state.history.length]);

  /** 玩家呼叫：只在合法回合才處理（PvP 永遠合法；AI 模式要輪到人類） */
  const play = (r: number, c: number) => {
    if (state.mode === 'ai' && state.turn !== state.humanSide) return;
    dispatch({ type: 'play', r, c });
  };

  return {
    state,
    play,
    undo: () => dispatch({ type: 'undo' }),
    restart: () => dispatch({ type: 'restart' }),
    setMode: (mode: GomokuPrefs['mode'], humanSide?: Color) =>
      dispatch({ type: 'setMode', mode, humanSide }),
    moveCursor: (dr: number, dc: number) =>
      dispatch({ type: 'moveCursor', dr, dc }),
  };
}
