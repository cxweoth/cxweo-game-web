'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getBestTime, setBestTime } from '@/lib/storage';
import { boardToTiles, isSolved, shuffle, tryClickTile, tryMove } from './game';
import { SLUG, type Board, type Direction } from './types';

/**
 * 15 Puzzle hook
 *
 * status:
 *   'idle'   還沒開始(玩家還沒做第一次移動)
 *   'playing' 正在玩(計時開始)
 *   'solved' 已完成
 *
 * 計時用 startedAt + tickRef:每秒 setInterval 觸發 setNow 重新算秒數,
 * 不在每次 move 用 setState 重新計算(會增加 React 重繪頻率)。
 *
 * 最佳時間用 getBestTime/setBestTime,key=`fifteen`(只有一種難度)。
 */
export function useFifteen() {
  const [board, setBoard] = useState<Board>(() => shuffle());
  const [moves, setMoves] = useState<number>(0);
  const [status, setStatus] = useState<'idle' | 'playing' | 'solved'>('idle');
  const [best, setBest] = useState<number | null>(null);
  const [now, setNow] = useState<number>(0);

  const startedAtRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    setBest(getBestTime(SLUG));
  }, []);

  // 計時:playing 時每 250ms 拉一次 setNow,讓秒數顯示更新
  useEffect(() => {
    if (status !== 'playing') {
      if (tickRef.current !== null) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }
    const id = window.setInterval(() => setNow(performance.now()), 250);
    tickRef.current = id;
    return () => window.clearInterval(id);
  }, [status]);

  const elapsedMs =
    status === 'idle' || startedAtRef.current === null
      ? 0
      : (status === 'solved'
          ? (now || performance.now())
          : (now || performance.now())) - startedAtRef.current;

  const apply = useCallback((next: Board) => {
    setBoard(next);
    setMoves((m) => m + 1);
    if (isSolved(next)) {
      setStatus('solved');
      const final = startedAtRef.current === null
        ? 0
        : Math.round((performance.now() - startedAtRef.current) / 100) / 10;
      const updated = setBestTime(SLUG, final);
      if (updated) setBest(final);
    }
  }, []);

  const ensureStarted = useCallback(() => {
    if (status === 'idle') {
      startedAtRef.current = performance.now();
      setNow(performance.now());
      setStatus('playing');
    }
  }, [status]);

  const move = useCallback(
    (dir: Direction) => {
      if (status === 'solved') return;
      const next = tryMove(board, dir);
      if (!next) return;
      ensureStarted();
      apply(next);
    },
    [board, status, apply, ensureStarted],
  );

  const clickTile = useCallback(
    (tileIdx: number) => {
      if (status === 'solved') return;
      const next = tryClickTile(board, tileIdx);
      if (!next) return;
      ensureStarted();
      apply(next);
    },
    [board, status, apply, ensureStarted],
  );

  const restart = useCallback(() => {
    setBoard(shuffle());
    setMoves(0);
    startedAtRef.current = null;
    setNow(0);
    setStatus('idle');
  }, []);

  return {
    board,
    tiles: boardToTiles(board),
    moves,
    status,
    best,
    elapsedSec: Math.max(0, elapsedMs / 1000),
    move,
    clickTile,
    restart,
  };
}
