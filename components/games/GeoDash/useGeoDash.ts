'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { readJSON, writeJSON } from '@/lib/storage';
import { SLUG, emptyStats, type Mode, type Stats, type Status } from './types';

const STATS_KEY = `${SLUG}:stats`;

/**
 * 主 hook。狀態盡量精簡 —
 *   - 距離 / 進度條 / 玩家位置都由 Canvas 的 worldRef 為 source of truth,
 *     直接在 Canvas 內畫,不走 React 每幀 re-render
 *   - React 只管 mode / status / stats / runId / audio mute
 */
export function useGeoDash() {
  const [mode, setMode] = useState<Mode>('level');
  const [status, setStatus] = useState<Status>('idle');
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [runId, setRunId] = useState(0);
  const [audioMuted, setAudioMuted] = useState(false);

  const startMsRef = useRef<number>(0);
  const settledRef = useRef(false);
  const statsRef = useRef<Stats>(emptyStats);
  const modeRef = useRef<Mode>('level');

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const s = readJSON<Stats>(STATS_KEY);
    if (s) {
      const merged = { ...emptyStats, ...s };
      statsRef.current = merged;
      setStats(merged);
    }
  }, []);

  const persistStats = useCallback((next: Stats) => {
    statsRef.current = next;
    setStats(next);
    writeJSON(STATS_KEY, next);
  }, []);

  const onStart = useCallback(() => {
    setStatus((cur) => {
      if (cur !== 'idle') return cur;
      startMsRef.current = performance.now();
      return 'playing';
    });
  }, []);

  const onDeath = useCallback(
    (finalDist: number) => {
      if (settledRef.current) return;
      settledRef.current = true;
      setStatus('dead');
      if (modeRef.current === 'endless') {
        const dist = Math.floor(finalDist);
        if (dist > statsRef.current.bestEndless) {
          persistStats({ ...statsRef.current, bestEndless: dist });
        }
      }
    },
    [persistStats],
  );

  const onWin = useCallback(() => {
    if (settledRef.current) return;
    settledRef.current = true;
    setStatus('won');
    const elapsed = performance.now() - startMsRef.current;
    const next: Stats = {
      ...statsRef.current,
      levelClears: statsRef.current.levelClears + 1,
    };
    if (statsRef.current.bestLevelMs === null || elapsed < statsRef.current.bestLevelMs) {
      next.bestLevelMs = elapsed;
    }
    persistStats(next);
  }, [persistStats]);

  const restart = useCallback(() => {
    settledRef.current = false;
    setStatus('idle');
    setRunId((r) => r + 1);
  }, []);

  const switchMode = useCallback((m: Mode) => {
    settledRef.current = false;
    setMode(m);
    setStatus('idle');
    setRunId((r) => r + 1);
  }, []);

  const toggleAudio = useCallback(() => setAudioMuted((m) => !m), []);

  return {
    mode,
    status,
    stats,
    runId,
    audioMuted,
    onStart,
    onDeath,
    onWin,
    restart,
    switchMode,
    toggleAudio,
  };
}
