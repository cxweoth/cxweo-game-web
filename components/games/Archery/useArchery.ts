'use client';

import { useEffect, useState } from 'react';
import { getHighScore, setHighScore } from '@/lib/storage';
import { CFG, SLUG, type LandedArrow } from './types';

function newWind(): number {
  const sign = Math.random() < 0.5 ? -1 : 1;
  const mag = CFG.windMin + Math.random() * (CFG.windMax - CFG.windMin);
  return sign * mag;
}

/**
 * 回合層級狀態。物理與每幀繪製不在這裡；那由 ArcheryCanvas 的 rAF 處理。
 * 這個 hook 只管：
 *   - 已射箭的歷史
 *   - 當前風向（每箭重新隨機）
 *   - 總分與最佳
 *   - status: 'playing' / 'gameOver'
 */
export function useArchery() {
  const [status, setStatus] = useState<'playing' | 'gameOver'>('playing');
  const [shots, setShots] = useState<LandedArrow[]>([]);
  const [wind, setWind] = useState<number>(0);
  const [best, setBest] = useState<number | null>(null);

  // 首次掛載：讀最佳分 + 初始化風（避免 SSR/CSR 不一致，wind 初值是 0）
  useEffect(() => {
    setBest(getHighScore(SLUG));
    setWind(newWind());
  }, []);

  const totalScore = shots.reduce((s, a) => s + a.score, 0);
  const arrowsLeft = CFG.arrowsPerRound - shots.length;

  function recordShot(arrow: LandedArrow) {
    setShots((prev) => {
      const next = [...prev, arrow];
      if (next.length >= CFG.arrowsPerRound) {
        const total = next.reduce((s, a) => s + a.score, 0);
        const updated = setHighScore(SLUG, total);
        if (updated) setBest(total);
        setStatus('gameOver');
      } else {
        setWind(newWind());
      }
      return next;
    });
  }

  function restart() {
    setShots([]);
    setStatus('playing');
    setWind(newWind());
  }

  return {
    status,
    shots,
    wind,
    best,
    totalScore,
    arrowsLeft,
    recordShot,
    restart,
  };
}
