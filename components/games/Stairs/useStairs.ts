'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getHighScore, setHighScore } from '@/lib/storage';
import { CFG, SLUG } from './types';

/**
 * 回合層級狀態(HP / score / status / best)。物理在 game.ts、
 * 渲染在 render.ts、輸入與 rAF 在 StairsCanvas.tsx。
 */
export function useStairs() {
  const [status, setStatus] = useState<'playing' | 'gameOver'>('playing');
  const [score, setScore] = useState<number>(0);
  const [hp, setHP] = useState<number>(CFG.maxHP);
  const [best, setBest] = useState<number | null>(null);

  const scoreRef = useRef<number>(0);

  useEffect(() => {
    setBest(getHighScore(SLUG));
  }, []);

  const onScore = useCallback((delta: number) => {
    scoreRef.current += delta;
    setScore(scoreRef.current);
  }, []);

  const onDamage = useCallback((amount: number) => {
    setHP((h) => {
      const next = Math.max(0, h - amount);
      if (next <= 0) {
        setStatus('gameOver');
        const final = scoreRef.current;
        const updated = setHighScore(SLUG, final);
        if (updated) setBest(final);
      }
      return next;
    });
  }, []);

  const onHeal = useCallback((amount: number) => {
    setHP((h) => Math.min(CFG.maxHP, h + amount));
  }, []);

  const restart = useCallback(() => {
    scoreRef.current = 0;
    setScore(0);
    setHP(CFG.maxHP);
    setStatus('playing');
  }, []);

  return { status, score, hp, best, onScore, onDamage, onHeal, restart };
}
