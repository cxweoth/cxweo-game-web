'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getHighScore, setHighScore } from '@/lib/storage';
import { SLUG } from './types';

export function useBubbleShooter() {
  const [status, setStatus] = useState<'playing' | 'gameOver' | 'win'>('playing');
  const [score, setScore] = useState<number>(0);
  const [best, setBest] = useState<number | null>(null);
  const scoreRef = useRef<number>(0);

  useEffect(() => {
    setBest(getHighScore(SLUG));
  }, []);

  const onScore = useCallback((points: number) => {
    scoreRef.current += points;
    setScore(scoreRef.current);
  }, []);

  const finalize = useCallback((kind: 'gameOver' | 'win') => {
    setStatus((prev) => {
      if (prev !== 'playing') return prev;
      const final = scoreRef.current;
      const updated = setHighScore(SLUG, final);
      if (updated) setBest(final);
      return kind;
    });
  }, []);

  const onGameOver = useCallback(() => finalize('gameOver'), [finalize]);
  const onWin = useCallback(() => finalize('win'), [finalize]);

  const restart = useCallback(() => {
    scoreRef.current = 0;
    setScore(0);
    setStatus('playing');
  }, []);

  return { status, score, best, onScore, onGameOver, onWin, restart };
}
