'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getBestTime, readJSON, setBestTime, writeJSON } from '@/lib/storage';
import {
  canRotate,
  createInitialState,
  hintTowardAllHoriz,
  hintTowardAllVertical,
  isAllHorizontal,
  isAllVertical,
  remainingToAllHoriz,
  remainingToAllVertical,
  tryRotate,
} from './logic';
import {
  DEFAULT_COUNT,
  DEFAULT_GOAL,
  DIAL_COUNTS,
  SLUG,
  optimalSteps,
  type DialCount,
  type Goal,
  type State,
} from './types';

const PREFS_KEY = `${SLUG}:prefs`;

type Status = 'playing' | 'cleared';

/**
 * Spin-Out hook
 *
 * 與 NineRings 邏輯同構,但在這裡用 vertical/horizontal 的語意說話。
 * 最佳步數 key=`spin-out:<n>:<goal>`,各 (count × goal) 獨立紀錄。
 */
export function useSpinOut() {
  const [count, setCount] = useState<DialCount>(DEFAULT_COUNT);
  const [goal, setGoal] = useState<Goal>(DEFAULT_GOAL);
  const [state, setState] = useState<State>(() =>
    createInitialState(DEFAULT_COUNT, DEFAULT_GOAL),
  );
  const [moves, setMoves] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [bestByKey, setBestByKey] = useState<Record<string, number | null>>({});
  const [invalid, setInvalid] = useState<{ dial: number; at: number } | null>(null);

  const historyRef = useRef<State[]>([]);
  const bestKey = (c: number, g: Goal) => `${c}:${g}`;

  useEffect(() => {
    const p = readJSON<{ count: DialCount; goal: Goal }>(PREFS_KEY);
    const n: DialCount =
      p?.count !== undefined && (DIAL_COUNTS as readonly number[]).includes(p.count)
        ? p.count
        : DEFAULT_COUNT;
    const g: Goal = p?.goal === 'lock' ? 'lock' : 'release';
    setCount(n);
    setGoal(g);
    setState(createInitialState(n, g));
    setMoves(0);
    historyRef.current = [];
    const best: Record<string, number | null> = {};
    for (const c of DIAL_COUNTS) {
      for (const gg of ['release', 'lock'] as Goal[]) {
        best[bestKey(c, gg)] = getBestTime(`${SLUG}:${c}:${gg}`);
      }
    }
    setBestByKey(best);
  }, []);

  const reachedGoal = goal === 'release' ? isAllHorizontal(state) : isAllVertical(state);
  const cleared = reachedGoal && moves > 0;
  const status: Status = cleared ? 'cleared' : 'playing';

  // 通關 → 寫入該 (count × goal) 最佳步數
  useEffect(() => {
    if (!cleared) return;
    const k = `${SLUG}:${count}:${goal}`;
    const updated = setBestTime(k, moves);
    if (updated) {
      setBestByKey((prev) => ({ ...prev, [bestKey(count, goal)]: moves }));
    }
  }, [cleared, moves, count, goal]);

  useEffect(() => {
    if (!invalid) return;
    const id = window.setTimeout(() => setInvalid(null), 240);
    return () => window.clearTimeout(id);
  }, [invalid]);

  const tryClick = useCallback(
    (dial: number) => {
      if (cleared) return;
      const next = tryRotate(state, dial);
      if (!next) {
        setInvalid({ dial, at: performance.now() });
        return;
      }
      historyRef.current.push(state);
      if (historyRef.current.length > 1000) historyRef.current.shift();
      setState(next);
      setMoves((m) => m + 1);
    },
    [cleared, state],
  );

  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    setState(prev);
    setMoves((m) => Math.max(0, m - 1));
  }, []);

  const reset = useCallback(() => {
    setState(createInitialState(count, goal));
    setMoves(0);
    historyRef.current = [];
  }, [count, goal]);

  const changeCount = useCallback(
    (next: DialCount) => {
      setCount(next);
      setState(createInitialState(next, goal));
      setMoves(0);
      historyRef.current = [];
      writeJSON(PREFS_KEY, { count: next, goal });
    },
    [goal],
  );

  const changeGoal = useCallback(
    (next: Goal) => {
      setGoal(next);
      setState(createInitialState(count, next));
      setMoves(0);
      historyRef.current = [];
      writeJSON(PREFS_KEY, { count, goal: next });
    },
    [count],
  );

  const remainingSteps =
    goal === 'release' ? remainingToAllHoriz(state) : remainingToAllVertical(state);
  const hintDial = showHint
    ? goal === 'release'
      ? hintTowardAllHoriz(state)
      : hintTowardAllVertical(state)
    : null;
  const optimal = optimalSteps(count);
  const best = bestByKey[`${count}:${goal}`] ?? null;

  // 滑桿伸出比例:從右邊算起,連續 horizontal 的旋鈕數 / count(0..1)
  // 滑桿可以滑到「最右邊那個 vertical 旋鈕」前;若全 H,完全滑出。
  let releaseProgress = 0;
  for (let i = 0; i < state.length; i++) {
    if (state[i]) break; // 第 i+1 個是 vertical → 卡住
    releaseProgress += 1;
  }
  releaseProgress = releaseProgress / count;

  return {
    count,
    goal,
    state,
    moves,
    status,
    cleared,
    invalid,
    showHint,
    hintDial,
    best,
    remainingSteps,
    optimal,
    releaseProgress,
    tryClick,
    undo,
    reset,
    changeCount,
    changeGoal,
    setShowHint,
    canRotate: (dial: number) => canRotate(state, dial),
    canUndo: historyRef.current.length > 0,
  };
}
