// 小蜜蜂 React state hook:分數、命、波次、status、best。
// 物理 World 完全在 GalaxianCanvas 的 ref 裡;這個 hook 只負責「玩家看得到」的數值。

import { useCallback, useEffect, useState } from 'react';
import { getHighScore, setHighScore } from '@/lib/storage';
import { CFG, SLUG } from './types';

export type Status = 'playing' | 'gameOver';

export type GalaxianHook = {
  status: Status;
  score: number;
  lives: number;
  wave: number;
  best: number | null;
  onScore: (delta: number) => void;
  onDamage: () => void;
  onWaveCleared: () => void;
  restart: () => void;
};

export function useGalaxian(): GalaxianHook {
  const [status, setStatus] = useState<Status>('playing');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState<number>(CFG.maxLives);
  const [wave, setWave] = useState<number>(1);
  const [best, setBest] = useState<number | null>(null);

  // SSR-safe:首次掛載再讀 localStorage
  useEffect(() => {
    setBest(getHighScore(SLUG));
  }, []);

  const onScore = useCallback((delta: number) => {
    setScore((s) => s + delta);
  }, []);

  const onDamage = useCallback(() => {
    setLives((l) => {
      const next = l - 1;
      if (next <= 0) {
        setStatus('gameOver');
        return 0;
      }
      return next;
    });
  }, []);

  const onWaveCleared = useCallback(() => {
    setWave((w) => w + 1);
  }, []);

  // 結束時寫入最高紀錄
  useEffect(() => {
    if (status !== 'gameOver') return;
    const updated = setHighScore(SLUG, score);
    if (updated) setBest(score);
  }, [status, score]);

  const restart = useCallback(() => {
    setStatus('playing');
    setScore(0);
    setLives(CFG.maxLives);
    setWave(1);
  }, []);

  return { status, score, lives, wave, best, onScore, onDamage, onWaveCleared, restart };
}
