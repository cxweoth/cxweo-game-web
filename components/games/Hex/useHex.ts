'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { readJSON, writeJSON } from '@/lib/storage';
import {
  applyMove,
  applySwap,
  checkWinner,
  createInitialBoard,
  findWinningPath,
  isPlayable,
} from './logic';
import { chooseAiMove, shouldSwap } from './ai';
import {
  DEFAULT_PREFS,
  EMPTY_STATS,
  SLUG,
  opponent,
  type Board,
  type Mode,
  type Player,
  type Prefs,
  type Stats,
} from './types';

const PREFS_KEY = `${SLUG}:prefs`;
const STATS_KEY = `${SLUG}:stats`;

type Status = 'playing' | 'gameOver';

/**
 * 六貫棋 Hex hook
 *
 * Pie 規則處理重點:第 1 手已下、輪到白方時 canSwap=true。
 *   - 白方點普通空格 = 不 swap,直接下第 2 手
 *   - 白方按 swap 按鈕 = 把第 1 手改成白色,輪回黑下第 2 手
 * AI 是白方時用 shouldSwap 自動判斷。
 */
export function useHex() {
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const [board, setBoard] = useState<Board>(() => createInitialBoard(DEFAULT_PREFS.size));
  const [turn, setTurn] = useState<Player>(1);
  const [status, setStatus] = useState<Status>('playing');
  const [winner, setWinner] = useState<0 | 1 | 2>(0);
  const [winPath, setWinPath] = useState<number[]>([]);
  const [lastMove, setLastMove] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [moveCount, setMoveCount] = useState<number>(0);
  const [firstMoveIdx, setFirstMoveIdx] = useState<number | null>(null);
  /** 剛發生過 Swap → UI 顯示橫幅讓玩家知道第一手被換色;玩家下一手後清掉 */
  const [swapNotice, setSwapNotice] = useState<{ by: 'ai' | 'player'; idx: number } | null>(null);

  const aiThinkingRef = useRef<boolean>(false);
  const aiTimerRef = useRef<number | null>(null);
  const settledRef = useRef<boolean>(false);

  // 載入 prefs / stats
  useEffect(() => {
    const p = readJSON<Prefs>(PREFS_KEY);
    if (p) {
      const merged: Prefs = { ...DEFAULT_PREFS, ...p };
      setPrefsState(merged);
      setBoard(createInitialBoard(merged.size));
    }
    const s = readJSON<Stats>(STATS_KEY);
    if (s) setStats({ ...EMPTY_STATS, ...s });
  }, []);

  const inAiTurn = (t: Player, mode: Mode, side: Player): boolean =>
    mode === 'ai' && t !== side;

  const canSwap = useMemo(() => {
    return (
      status === 'playing' &&
      prefs.pieRule &&
      moveCount === 1 &&
      turn === 2 &&
      firstMoveIdx !== null
    );
  }, [status, prefs.pieRule, moveCount, turn, firstMoveIdx]);

  const resetState = useCallback((size: number) => {
    if (aiTimerRef.current !== null) window.clearTimeout(aiTimerRef.current);
    settledRef.current = false;
    setBoard(createInitialBoard(size));
    setTurn(1);
    setStatus('playing');
    setWinner(0);
    setWinPath([]);
    setLastMove(null);
    setMoveCount(0);
    setFirstMoveIdx(null);
    setSwapNotice(null);
  }, []);

  const settle = useCallback(
    (b: Board, w: Player) => {
      if (settledRef.current) return;
      settledRef.current = true;
      setStatus('gameOver');
      setWinner(w);
      const path = findWinningPath(b, w, prefs.size);
      if (path) setWinPath(path);
      if (prefs.mode === 'ai') {
        const playerWon = w === prefs.playerSide;
        const next: Stats = {
          wins: stats.wins + (playerWon ? 1 : 0),
          losses: stats.losses + (playerWon ? 0 : 1),
          draws: stats.draws,
        };
        setStats(next);
        writeJSON(STATS_KEY, next);
      }
    },
    [prefs.mode, prefs.playerSide, prefs.size, stats],
  );

  const advanceAfterMove = useCallback(
    (next: Board, idx: number, who: Player, prevMoveCount: number) => {
      setBoard(next);
      setLastMove(idx);
      const newMoveCount = prevMoveCount + 1;
      setMoveCount(newMoveCount);
      if (newMoveCount === 1) setFirstMoveIdx(idx);
      // 一般落子後清掉 Swap 提示橫幅
      setSwapNotice(null);
      const w = checkWinner(next, prefs.size);
      if (w !== 0) settle(next, w);
      else setTurn(opponent(who));
    },
    [prefs.size, settle],
  );

  // 玩家點擊空格落子
  const clickCell = useCallback(
    (idx: number) => {
      if (status !== 'playing') return;
      if (aiThinkingRef.current) return;
      if (inAiTurn(turn, prefs.mode, prefs.playerSide)) return;
      if (!isPlayable(board, idx)) return;
      advanceAfterMove(applyMove(board, idx, turn), idx, turn, moveCount);
    },
    [status, turn, prefs.mode, prefs.playerSide, board, moveCount, advanceAfterMove],
  );

  // 玩家(白方)按 swap
  const performSwap = useCallback(() => {
    if (!canSwap || firstMoveIdx === null) return;
    const next = applySwap(board, firstMoveIdx);
    setBoard(next);
    setLastMove(firstMoveIdx);
    setMoveCount(2);
    setTurn(1);
    setSwapNotice({ by: 'player', idx: firstMoveIdx });
  }, [canSwap, board, firstMoveIdx]);

  // AI 自動下
  useEffect(() => {
    if (status !== 'playing') return;
    if (!inAiTurn(turn, prefs.mode, prefs.playerSide)) return;
    aiThinkingRef.current = true;
    const tid = window.setTimeout(() => {
      // AI 是白方且 canSwap → 用 shouldSwap 判斷
      if (canSwap && firstMoveIdx !== null) {
        if (shouldSwap(firstMoveIdx, prefs.size)) {
          const next = applySwap(board, firstMoveIdx);
          setBoard(next);
          setLastMove(firstMoveIdx);
          setMoveCount(2);
          setTurn(1);
          setSwapNotice({ by: 'ai', idx: firstMoveIdx });
          aiThinkingRef.current = false;
          return;
        }
        // 不 swap → 繼續走一般步
      }
      const idx = chooseAiMove(board, turn, prefs.size);
      aiThinkingRef.current = false;
      if (idx === null) return;
      const next = applyMove(board, idx, turn);
      advanceAfterMove(next, idx, turn, moveCount);
    }, 420);
    aiTimerRef.current = tid;
    return () => {
      window.clearTimeout(tid);
      aiThinkingRef.current = false;
    };
  }, [
    board,
    turn,
    status,
    prefs.mode,
    prefs.playerSide,
    prefs.size,
    canSwap,
    firstMoveIdx,
    moveCount,
    advanceAfterMove,
  ]);

  const restart = useCallback(() => {
    resetState(prefs.size);
  }, [prefs.size, resetState]);

  const setPrefs = useCallback(
    (partial: Partial<Prefs>) => {
      const next = { ...prefs, ...partial };
      setPrefsState(next);
      writeJSON(PREFS_KEY, next);
      const needRestart =
        (partial.mode !== undefined && partial.mode !== prefs.mode) ||
        (partial.playerSide !== undefined && partial.playerSide !== prefs.playerSide) ||
        (partial.size !== undefined && partial.size !== prefs.size) ||
        (partial.pieRule !== undefined && partial.pieRule !== prefs.pieRule);
      if (needRestart) resetState(next.size);
    },
    [prefs, resetState],
  );

  const isAiThinking =
    status === 'playing' && inAiTurn(turn, prefs.mode, prefs.playerSide);

  return {
    board,
    turn,
    status,
    winner,
    winPath,
    lastMove,
    prefs,
    stats,
    canSwap,
    swapNotice,
    isAiThinking,
    clickCell,
    performSwap,
    restart,
    setPrefs,
  };
}
