'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { readJSON, writeJSON } from '@/lib/storage';
import { CFG, SLUG, emptyStats, type Stats, type Status } from './types';

const STATS_KEY = `${SLUG}:stats`;

/**
 * 主 hook:status 是核心狀態機
 *   idle → (按方向鍵) → playing
 *   playing → (被吃) → dying → (1.5s) → playing(剩命) / gameOver(0 命)
 *   playing → (吃光豆子) → levelClear → (1.2s) → playing(level++)
 *   gameOver → restart → idle
 *
 * score 由 Canvas 的 worldRef 為 source of truth;onScoreUpdate 是給 hook
 * 用來在 game over 時拿到最終分數寫進 highScore。
 */
export function useMazeEater() {
  const [status, setStatus] = useState<Status>('idle');
  const [lives, setLives] = useState<number>(CFG.initialLives);
  const [level, setLevel] = useState<number>(1);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [runId, setRunId] = useState(0);
  const [actorResetKey, setActorResetKey] = useState(0);
  const [fullResetKey, setFullResetKey] = useState(0);

  const livesRef = useRef<number>(CFG.initialLives);
  const statsRef = useRef<Stats>(emptyStats);
  const lastScoreRef = useRef(0);

  useEffect(() => {
    const s = readJSON<Stats>(STATS_KEY);
    if (s) {
      const m = { ...emptyStats, ...s };
      statsRef.current = m;
      setStats(m);
    }
  }, []);

  const onScoreUpdate = useCallback((score: number) => {
    lastScoreRef.current = score;
  }, []);

  const onPacmanCaught = useCallback(() => {
    setStatus((s) => (s === 'playing' ? 'dying' : s));
  }, []);

  const onLevelClear = useCallback(() => {
    setStatus((s) => (s === 'playing' ? 'levelClear' : s));
  }, []);

  // dying → 1.5s 後復活或結束
  useEffect(() => {
    if (status !== 'dying') return;
    const tid = window.setTimeout(() => {
      const newLives = livesRef.current - 1;
      if (newLives <= 0) {
        livesRef.current = 0;
        setLives(0);
        setStatus('gameOver');
        const sc = lastScoreRef.current;
        if (sc > statsRef.current.highScore) {
          const next: Stats = { ...statsRef.current, highScore: sc };
          statsRef.current = next;
          setStats(next);
          writeJSON(STATS_KEY, next);
        }
      } else {
        livesRef.current = newLives;
        setLives(newLives);
        setActorResetKey((k) => k + 1);
        setStatus('playing');
      }
    }, 1500);
    return () => clearTimeout(tid);
  }, [status]);

  // levelClear → 1.2s 後重置迷宮
  useEffect(() => {
    if (status !== 'levelClear') return;
    const tid = window.setTimeout(() => {
      setLevel((l) => l + 1);
      setFullResetKey((k) => k + 1);
      setStatus('playing');
    }, 1200);
    return () => clearTimeout(tid);
  }, [status]);

  const restart = useCallback(() => {
    livesRef.current = CFG.initialLives;
    lastScoreRef.current = 0;
    setLives(CFG.initialLives);
    setLevel(1);
    setRunId((r) => r + 1);
    setStatus('idle');
  }, []);

  const start = useCallback(() => {
    setStatus((s) => (s === 'idle' ? 'playing' : s));
  }, []);

  return {
    status,
    lives,
    level,
    stats,
    runId,
    actorResetKey,
    fullResetKey,
    onScoreUpdate,
    onPacmanCaught,
    onLevelClear,
    restart,
    start,
  };
}
