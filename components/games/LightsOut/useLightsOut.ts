'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getBestTime, setBestTime, readJSON, writeJSON } from '@/lib/storage';
import {
  CELLS,
  DIFFICULTY_CLICKS,
  SIZE,
  SLUG,
  indexOf,
  type Board,
  type Difficulty,
} from './types';

const PREFS_KEY = `${SLUG}:diff`;

/** 從某格出發翻轉自己 + 上下左右 */
function applyClick(board: Board, idx: number): Board {
  const next = board.slice();
  const r = Math.floor(idx / SIZE);
  const c = idx % SIZE;
  const targets = [
    [r, c],
    [r - 1, c],
    [r + 1, c],
    [r, c - 1],
    [r, c + 1],
  ];
  for (const [tr, tc] of targets) {
    if (tr! < 0 || tr! >= SIZE || tc! < 0 || tc! >= SIZE) continue;
    const ti = indexOf(tr!, tc!);
    next[ti] = !next[ti];
  }
  return next;
}

/** 從全暗開始,亂點 N 次 → 必定可解的盤面 */
function generateBoard(diff: Difficulty): Board {
  let board: Board = new Array(CELLS).fill(false);
  const clicks = DIFFICULTY_CLICKS[diff];
  for (let i = 0; i < clicks; i++) {
    const r = Math.floor(Math.random() * CELLS);
    board = applyClick(board, r);
  }
  // 極小機率亂點剛好回到全暗 → 強制亂點一格保證有挑戰
  if (board.every((b) => !b)) board = applyClick(board, 12);
  return board;
}

export function useLightsOut() {
  const [diff, setDiff] = useState<Difficulty>('normal');
  const [board, setBoard] = useState<Board>(() => generateBoard('normal'));
  const [moves, setMoves] = useState<number>(0);
  const [best, setBest] = useState<Record<Difficulty, number | null>>({
    easy: null,
    normal: null,
    hard: null,
  });
  /** 清盤後鎖住,避免最後一擊還能再點 */
  const settledRef = useRef<boolean>(false);

  // 初始化:讀偏好難度與每難度最佳步數
  useEffect(() => {
    const d = readJSON<Difficulty>(PREFS_KEY);
    if (d === 'easy' || d === 'normal' || d === 'hard') setDiff(d);
    setBest({
      easy: getBestTime(`${SLUG}:easy:moves`),
      normal: getBestTime(`${SLUG}:normal:moves`),
      hard: getBestTime(`${SLUG}:hard:moves`),
    });
  }, []);

  const cleared = useMemo(() => board.every((b) => !b), [board]);

  // 通關 → 更新最佳步數(越小越好,複用 setBestTime 語意)
  useEffect(() => {
    if (!cleared) return;
    if (settledRef.current) return;
    if (moves === 0) return; // 從一開始就是全暗,不算
    settledRef.current = true;
    const updated = setBestTime(`${SLUG}:${diff}:moves`, moves);
    if (updated) {
      setBest((prev) => ({ ...prev, [diff]: moves }));
    }
  }, [cleared, moves, diff]);

  const click = useCallback(
    (idx: number) => {
      if (cleared) return;
      setBoard((b) => applyClick(b, idx));
      setMoves((m) => m + 1);
    },
    [cleared],
  );

  const newPuzzle = useCallback(
    (next?: Difficulty) => {
      const d = next ?? diff;
      settledRef.current = false;
      setBoard(generateBoard(d));
      setMoves(0);
      if (next && next !== diff) {
        setDiff(next);
        writeJSON(PREFS_KEY, next);
      }
    },
    [diff],
  );

  return {
    board,
    moves,
    diff,
    best,
    cleared,
    click,
    newPuzzle,
  };
}
