'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getHighScore, setHighScore } from '@/lib/storage';
import { CFG, SLUG } from './types';

type Status = 'idle' | 'playing' | 'gameOver';

/**
 * 回合狀態 + level + lives + 與最高分。
 * worldRef 在 BreakoutCanvas 自己管;hook 透過 callbacks 收 brickHit / lifeLost / levelClear。
 *
 * runId 在 start / 升級時 bump,讓 BreakoutCanvas 重建 world。注意 setStatus 與
 * setRunId 必須在同一個 callback batch 進去,避免「再玩一次要點兩次」的競態
 * (參考 useSnake 的同類修法)。
 */
export function useBreakout() {
  const [status, setStatus] = useState<Status>('idle');
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(CFG.startLives);
  const [level, setLevel] = useState<number>(1);
  const [best, setBest] = useState<number | null>(null);
  const [runId, setRunId] = useState<number>(0);

  const scoreRef = useRef<number>(0);

  useEffect(() => {
    setBest(getHighScore(SLUG));
  }, []);

  const onBrickHit = useCallback((points: number) => {
    scoreRef.current += points;
    setScore(scoreRef.current);
  }, []);

  const onLifeLost = useCallback(() => {
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

  const onLevelClear = useCallback(() => {
    // 同 callback 一起 batch,避免中間幀有「level 已變 / world 還是舊」窗口
    setLevel((l) => l + 1);
    setRunId((r) => r + 1);
  }, []);

  const start = useCallback(() => {
    scoreRef.current = 0;
    setScore(0);
    setLives(CFG.startLives);
    setLevel(1);
    setStatus('playing');
    setRunId((r) => r + 1);
  }, []);

  return {
    status,
    score,
    lives,
    level,
    best,
    runId,
    start,
    onBrickHit,
    onLifeLost,
    onLevelClear,
  };
}
