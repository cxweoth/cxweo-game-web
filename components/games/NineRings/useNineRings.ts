'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getBestTime, readJSON, setBestTime, writeJSON } from '@/lib/storage';
import {
  canToggle,
  createInitialState,
  hintTowardAllOff,
  hintTowardAllOn,
  isAllOff,
  isAllOn,
  remainingToAllOff,
  remainingToAllOn,
  tryToggle,
} from './logic';
import {
  DEFAULT_COUNT,
  DEFAULT_GOAL,
  RING_COUNTS,
  SLUG,
  optimalSteps,
  type Goal,
  type RingCount,
  type State,
} from './types';

const PREFS_KEY = `${SLUG}:prefs`;

type Status = 'playing' | 'cleared';

/**
 * 九連環 hook
 *
 * 狀態機簡單:cleared = isAllOff(state)。每次切換即時檢查。
 * 「最佳步數」每環數獨立記錄(setBestTime 越小越好,key=`nine-rings:<n>`)。
 * 提示:hintRing 為下一步建議的環編號(自動更新);UI 只負責高亮。
 * 抖動:對非法切換閃紅 200ms,用 invalidAt 計時。
 */
export function useNineRings() {
  const [count, setCount] = useState<RingCount>(DEFAULT_COUNT);
  const [goal, setGoal] = useState<Goal>(DEFAULT_GOAL);
  const [state, setState] = useState<State>(() =>
    createInitialState(DEFAULT_COUNT, DEFAULT_GOAL),
  );
  const [moves, setMoves] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  /** 最佳步數的 key 是 `${count}:${goal}`,讓拆下/放回各環各自記錄 */
  const [bestByKey, setBestByKey] = useState<Record<string, number | null>>({});
  const [invalid, setInvalid] = useState<{ ring: number; at: number } | null>(null);

  const historyRef = useRef<State[]>([]);

  const bestKey = (c: number, g: Goal) => `${c}:${g}`;

  // 初始化:讀偏好環數 / 目標,與所有 (count × goal) 的最佳步數
  useEffect(() => {
    const p = readJSON<{ count: RingCount; goal: Goal }>(PREFS_KEY);
    const n: RingCount =
      p?.count !== undefined && (RING_COUNTS as readonly number[]).includes(p.count)
        ? p.count
        : DEFAULT_COUNT;
    const g: Goal = p?.goal === 'put-back' ? 'put-back' : 'take-off';
    setCount(n);
    setGoal(g);
    setState(createInitialState(n, g));
    setMoves(0);
    historyRef.current = [];
    const best: Record<string, number | null> = {};
    for (const c of RING_COUNTS) {
      for (const gg of ['take-off', 'put-back'] as Goal[]) {
        best[bestKey(c, gg)] = getBestTime(`${SLUG}:${c}:${gg}`);
      }
    }
    setBestByKey(best);
  }, []);

  const reachedGoal = goal === 'take-off' ? isAllOff(state) : isAllOn(state);
  const cleared = reachedGoal && moves > 0;
  const status: Status = cleared ? 'cleared' : 'playing';

  // 通關 → 寫入該 (count × goal) 的最佳步數
  useEffect(() => {
    if (!cleared) return;
    const k = `${SLUG}:${count}:${goal}`;
    const updated = setBestTime(k, moves);
    if (updated) {
      setBestByKey((prev) => ({ ...prev, [bestKey(count, goal)]: moves }));
    }
  }, [cleared, moves, count, goal]);

  // 自動清掉非法閃爍(220ms 後)
  useEffect(() => {
    if (!invalid) return;
    const id = window.setTimeout(() => setInvalid(null), 220);
    return () => window.clearTimeout(id);
  }, [invalid]);

  const tryClick = useCallback(
    (ring: number) => {
      if (cleared) return;
      const next = tryToggle(state, ring);
      if (!next) {
        setInvalid({ ring, at: performance.now() });
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
    (next: RingCount) => {
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

  // 衍生資訊:依目標而定
  const remainingSteps =
    goal === 'take-off' ? remainingToAllOff(state) : remainingToAllOn(state);
  const hintRing = showHint
    ? goal === 'take-off'
      ? hintTowardAllOff(state)
      : hintTowardAllOn(state)
    : null;
  const optimal = optimalSteps(count);
  const best = bestByKey[`${count}:${goal}`] ?? null;

  return {
    count,
    goal,
    state,
    moves,
    status,
    cleared,
    invalid,
    showHint,
    hintRing,
    best,
    remainingSteps,
    optimal,
    tryClick,
    undo,
    reset,
    changeCount,
    changeGoal,
    setShowHint,
    canToggle: (ring: number) => canToggle(state, ring),
    canUndo: historyRef.current.length > 0,
  };
}
