'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { readJSON, writeJSON } from '@/lib/storage';
import { LEVELS } from './levels';
import { isCleared, parseLevel, tryMove } from './game';
import { SLUG, type Direction, type Dynamic } from './types';

const PROGRESS_KEY = `${SLUG}:progress`;
const BEST_KEY = `${SLUG}:best`;

/**
 * Sokoban hook
 *
 * 每關各自記錄「最少步數」(越小越好) → bestMoves[levelIndex]。
 * 進度(已通關到第幾關)單獨存,玩家可隨時切回任意已解鎖關。
 */

type Progress = {
  /** 已完成過的關卡 index 集合 */
  cleared: number[];
};
const EMPTY_PROGRESS: Progress = { cleared: [] };

type BestMoves = Record<number, number>;

type Snapshot = Dynamic;

export function useSokoban() {
  const [levelIdx, setLevelIdx] = useState<number>(0);
  const [parsed, setParsed] = useState(() => parseLevel(LEVELS[0]!));
  const [dyn, setDyn] = useState<Dynamic>(() => parsed.dyn);
  const [moves, setMoves] = useState<number>(0);
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);
  const [bestMoves, setBestMoves] = useState<BestMoves>({});

  /** undo 歷史:存 dynamic 快照 */
  const historyRef = useRef<Snapshot[]>([]);

  useEffect(() => {
    const p = readJSON<Progress>(PROGRESS_KEY);
    if (p) setProgress(p);
    const b = readJSON<BestMoves>(BEST_KEY);
    if (b) setBestMoves(b);
  }, []);

  // 切換關卡:重新 parse + 清歷史
  useEffect(() => {
    const meta = LEVELS[levelIdx];
    if (!meta) return;
    const next = parseLevel(meta);
    setParsed(next);
    setDyn(next.dyn);
    setMoves(0);
    historyRef.current = [];
  }, [levelIdx]);

  const cleared = useMemo(() => isCleared(parsed.stat, dyn), [parsed.stat, dyn]);

  // 通關 → 寫入進度與 bestMoves
  useEffect(() => {
    if (!cleared) return;
    setProgress((prev) => {
      if (prev.cleared.includes(levelIdx)) return prev;
      const next: Progress = { cleared: [...prev.cleared, levelIdx] };
      writeJSON(PROGRESS_KEY, next);
      return next;
    });
    setBestMoves((prev) => {
      const cur = prev[levelIdx];
      if (cur === undefined || moves < cur) {
        const next: BestMoves = { ...prev, [levelIdx]: moves };
        writeJSON(BEST_KEY, next);
        return next;
      }
      return prev;
    });
  }, [cleared, levelIdx, moves]);

  const move = useCallback(
    (dir: Direction) => {
      if (cleared) return;
      const next = tryMove(parsed.stat, dyn, dir);
      if (!next) return;
      historyRef.current.push(dyn);
      // 防止 undo 歷史無限長(以實作面 ≥ 200 步幾乎用不到)
      if (historyRef.current.length > 500) historyRef.current.shift();
      setDyn(next);
      setMoves((m) => m + 1);
    },
    [cleared, parsed.stat, dyn],
  );

  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    setDyn(prev);
    setMoves((m) => Math.max(0, m - 1));
  }, []);

  const reset = useCallback(() => {
    historyRef.current = [];
    setDyn(parsed.dyn);
    setMoves(0);
  }, [parsed]);

  const goToLevel = useCallback((idx: number) => {
    if (idx < 0 || idx >= LEVELS.length) return;
    setLevelIdx(idx);
  }, []);

  const nextLevel = useCallback(() => {
    setLevelIdx((i) => Math.min(LEVELS.length - 1, i + 1));
  }, []);

  return {
    levels: LEVELS,
    levelIdx,
    levelMeta: LEVELS[levelIdx]!,
    stat: parsed.stat,
    dyn,
    moves,
    cleared,
    progress,
    bestMoves,
    move,
    undo,
    reset,
    goToLevel,
    nextLevel,
    canUndo: historyRef.current.length > 0,
  };
}
