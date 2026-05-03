'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getBestTime, readJSON, setBestTime, writeJSON } from '@/lib/storage';
import { generatePuzzle } from './generator';
import { findConflicts } from './solver';
import {
  CELLS,
  DIFF_CLUES,
  SIZE,
  SLUG,
  type Board,
  type Difficulty,
  type NotesArr,
} from './types';

const PREFS_KEY = `${SLUG}:prefs`;

type Status = 'playing' | 'solved';

type Snapshot = {
  values: Board;
  notes: NotesArr;
};

/**
 * 數獨 hook
 *
 * 狀態:
 *   givens   — 初始題目(boolean per cell:是否為線索,玩家不可改)
 *   values   — 玩家當前盤面(包含 givens)
 *   notes    — 每格 9 位元 bitmask,bit i = 候選 (i+1)
 *
 * 計時:第一次填寫(任何 set/clear 動作)才開始計時;solved 後停止。
 * 最佳時間用 setBestTime,key=`sudoku:<difficulty>`(秒,越短越好)。
 */
export function useSudoku() {
  const [diff, setDiff] = useState<Difficulty>('easy');
  const [givens, setGivens] = useState<boolean[]>(() => new Array(CELLS).fill(false));
  const [values, setValues] = useState<Board>(() => new Array(CELLS).fill(0));
  const [solution, setSolution] = useState<Board>(() => new Array(CELLS).fill(0));
  const [notes, setNotes] = useState<NotesArr>(() => new Array(CELLS).fill(0));
  const [selected, setSelected] = useState<number | null>(null);
  const [notesMode, setNotesMode] = useState<boolean>(false);
  const [highlightConflicts, setHighlightConflicts] = useState<boolean>(true);
  const [status, setStatus] = useState<Status>('playing');
  const [generating, setGenerating] = useState<boolean>(false);
  const [best, setBest] = useState<Record<Difficulty, number | null>>({
    easy: null,
    medium: null,
    hard: null,
    expert: null,
  });
  const [now, setNow] = useState<number>(0);

  const startedAtRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const historyRef = useRef<Snapshot[]>([]);

  // 初始化:讀偏好難度與最佳時間
  useEffect(() => {
    const p = readJSON<{ difficulty: Difficulty }>(PREFS_KEY);
    const d: Difficulty = p?.difficulty ?? 'easy';
    setDiff(d);
    setBest({
      easy: getBestTime(`${SLUG}:easy`),
      medium: getBestTime(`${SLUG}:medium`),
      hard: getBestTime(`${SLUG}:hard`),
      expert: getBestTime(`${SLUG}:expert`),
    });
    // 第一次也產一張題目
    newPuzzleSync(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 計時(playing 才動)
  useEffect(() => {
    if (status !== 'playing' || startedAtRef.current === null) {
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

  function newPuzzleSync(d: Difficulty) {
    const { puzzle, solution: sol } = generatePuzzle(d);
    const g = puzzle.map((v) => v !== 0);
    setGivens(g);
    setValues(puzzle.slice());
    setSolution(sol);
    setNotes(new Array(CELLS).fill(0));
    setSelected(null);
    setStatus('playing');
    startedAtRef.current = null;
    setNow(0);
    historyRef.current = [];
  }

  /** 新題目:用 setTimeout(0) 把生成丟到下個 tick,讓 UI 能先把「生成中」畫出來 */
  const newPuzzle = useCallback(
    (next?: Difficulty) => {
      const d = next ?? diff;
      setGenerating(true);
      window.setTimeout(() => {
        newPuzzleSync(d);
        if (next && next !== diff) {
          setDiff(next);
          writeJSON(PREFS_KEY, { difficulty: next });
        }
        setGenerating(false);
      }, 0);
    },
    [diff],
  );

  const ensureStarted = useCallback(() => {
    if (startedAtRef.current === null) {
      startedAtRef.current = performance.now();
      setNow(performance.now());
    }
  }, []);

  const pushHistory = useCallback(() => {
    historyRef.current.push({ values: values.slice(), notes: notes.slice() });
    if (historyRef.current.length > 500) historyRef.current.shift();
  }, [values, notes]);

  const setNumber = useCallback(
    (idx: number, n: number) => {
      if (status !== 'playing') return;
      if (givens[idx]) return;
      pushHistory();
      ensureStarted();
      if (notesMode) {
        const bit = 1 << (n - 1);
        setNotes((prev) => {
          const next = prev.slice();
          next[idx] = (next[idx] ?? 0) ^ bit;
          return next;
        });
        return;
      }
      setValues((prev) => {
        const next = prev.slice();
        next[idx] = n;
        return next;
      });
      // 落子後清掉同列同欄同宮的 notes 中 n
      setNotes((prev) => {
        const next = prev.slice();
        const r = Math.floor(idx / SIZE);
        const c = idx % SIZE;
        const br = Math.floor(r / 3) * 3;
        const bc = Math.floor(c / 3) * 3;
        const bit = 1 << (n - 1);
        for (let k = 0; k < SIZE; k++) {
          next[r * SIZE + k] = (next[r * SIZE + k] ?? 0) & ~bit;
          next[k * SIZE + c] = (next[k * SIZE + c] ?? 0) & ~bit;
        }
        for (let dr = 0; dr < 3; dr++) {
          for (let dc = 0; dc < 3; dc++) {
            const i = (br + dr) * SIZE + (bc + dc);
            next[i] = (next[i] ?? 0) & ~bit;
          }
        }
        next[idx] = 0; // 已填的格不該還有 notes
        return next;
      });
    },
    [status, givens, notesMode, pushHistory, ensureStarted],
  );

  const eraseCell = useCallback(
    (idx: number) => {
      if (status !== 'playing') return;
      if (givens[idx]) return;
      pushHistory();
      ensureStarted();
      setValues((prev) => {
        if (prev[idx] === 0) return prev;
        const next = prev.slice();
        next[idx] = 0;
        return next;
      });
      setNotes((prev) => {
        if (prev[idx] === 0) return prev;
        const next = prev.slice();
        next[idx] = 0;
        return next;
      });
    },
    [status, givens, pushHistory, ensureStarted],
  );

  const undo = useCallback(() => {
    const snap = historyRef.current.pop();
    if (!snap) return;
    setValues(snap.values);
    setNotes(snap.notes);
  }, []);

  // 衝突(僅當 highlightConflicts 開) — useMemo 因 values 改才算
  const conflicts = useMemo(() => {
    if (!highlightConflicts) return new Set<number>();
    return findConflicts(values);
  }, [values, highlightConflicts]);

  // 解開判定:全填且無衝突
  useEffect(() => {
    if (values.every((v) => v !== 0) && conflicts.size === 0 && startedAtRef.current !== null) {
      setStatus('solved');
      const finalSec = (performance.now() - startedAtRef.current) / 1000;
      const updated = setBestTime(`${SLUG}:${diff}`, finalSec);
      if (updated) setBest((prev) => ({ ...prev, [diff]: finalSec }));
    }
  }, [values, conflicts, diff]);

  const elapsedSec =
    startedAtRef.current === null
      ? 0
      : ((status === 'solved' ? now || performance.now() : now || performance.now()) -
          startedAtRef.current) /
        1000;

  return {
    diff,
    givens,
    values,
    solution,
    notes,
    selected,
    notesMode,
    highlightConflicts,
    status,
    generating,
    best,
    elapsedSec,
    conflicts,
    targetClues: DIFF_CLUES[diff],
    setSelected,
    setNotesMode,
    setHighlightConflicts,
    setNumber,
    eraseCell,
    undo,
    newPuzzle,
    canUndo: historyRef.current.length > 0,
  };
}
