'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getHighScore, setHighScore } from '@/lib/storage';
import { SLUG } from './types';

/**
 * 跳躍王 hook — React state 只管 status / score / 最佳分。
 * 玩家位置、平台、粒子等遊戲世界放在 DoodleJumpCanvas 的 worldRef。
 */
export function useDoodleJump() {
  const [status, setStatus] = useState<'playing' | 'gameOver'>('playing');
  const [score, setScore] = useState<number>(0);
  const [best, setBest] = useState<number | null>(null);
  const [runId, setRunId] = useState<number>(0);

  const scoreRef = useRef<number>(0);

  useEffect(() => {
    setBest(getHighScore(SLUG));
  }, []);

  const onScore = useCallback((s: number) => {
    if (s === scoreRef.current) return;
    scoreRef.current = s;
    setScore(s);
  }, []);

  const onDie = useCallback(() => {
    setStatus('gameOver');
    const final = scoreRef.current;
    const updated = setHighScore(SLUG, final);
    if (updated) setBest(final);
  }, []);

  const restart = useCallback(() => {
    scoreRef.current = 0;
    setScore(0);
    setStatus('playing');
    setRunId((r) => r + 1);
  }, []);

  return { status, score, best, runId, onScore, onDie, restart };
}
