'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getHighScore, setHighScore } from '@/lib/storage';
import { CFG, SLUG } from './types';

/**
 * 回合層級狀態:分數、生命、status、最佳分。
 * 物理由 CatchBallCanvas 用 rAF + refs 自己管。
 */
export function useCatchBall() {
  const [status, setStatus] = useState<'playing' | 'gameOver'>('playing');
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(CFG.maxLives);
  const [best, setBest] = useState<number | null>(null);

  // scoreRef:給 onMiss 結算時拿到當下分數(setLives 的 callback 拿不到)
  const scoreRef = useRef<number>(0);

  useEffect(() => {
    setBest(getHighScore(SLUG));
  }, []);

  const onCatch = useCallback((points: number) => {
    scoreRef.current += points;
    setScore(scoreRef.current);
  }, []);

  const onMiss = useCallback(() => {
    setLives((l) => {
      const next = l - 1;
      if (next <= 0) {
        setStatus('gameOver');
        const final = scoreRef.current;
        const updated = setHighScore(SLUG, final);
        if (updated) setBest(final);
      }
      return next;
    });
  }, []);

  const restart = useCallback(() => {
    scoreRef.current = 0;
    setScore(0);
    setLives(CFG.maxLives);
    setStatus('playing');
  }, []);

  return { status, score, lives, best, onCatch, onMiss, restart };
}
