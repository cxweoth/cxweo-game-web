'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getHighScore, setHighScore } from '@/lib/storage';
import { CFG, SLUG } from './types';

/**
 * 回合層級狀態:status / score / 最高分 / runId。
 * 蛇身、食物、step 計時等遊戲世界放在 SnakeCanvas 的 worldRef,React state 不管。
 *
 * scoreRef 與 score state 同步遞增,讓 onDie 結算時能拿到正確的最終分數
 * (setStatus 與 setHighScore 在同一輪 dispatch,從 state 讀取會是上一個值)。
 *
 * runId:每次 restart 遞增。SnakeCanvas 用它 key 在 useEffect 上重建 worldRef。
 * 必須跟 setStatus('playing') 在同一個 callback 裡 setRunId,React 才會把兩者 batch
 * 進同一次 render。否則會出現:render 1 status=playing+舊 world、rAF 用舊 world
 * 立刻 onDie 把 status 翻回 gameOver,變成「要點兩次再玩一次」的競態。
 */
export function useSnake() {
  const [status, setStatus] = useState<'playing' | 'gameOver'>('playing');
  const [score, setScore] = useState<number>(0);
  const [foodEaten, setFoodEaten] = useState<number>(0);
  const [maxLength, setMaxLength] = useState<number>(CFG.initialLength);
  const [best, setBest] = useState<number | null>(null);
  const [runId, setRunId] = useState<number>(0);

  const scoreRef = useRef<number>(0);

  useEffect(() => {
    setBest(getHighScore(SLUG));
  }, []);

  const onEat = useCallback(() => {
    scoreRef.current += CFG.foodScore;
    setScore(scoreRef.current);
    setFoodEaten((f) => f + 1);
    setMaxLength((l) => l + 1);
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
    setFoodEaten(0);
    setMaxLength(CFG.initialLength);
    setStatus('playing');
    setRunId((r) => r + 1);
  }, []);

  return {
    status,
    score,
    foodEaten,
    maxLength,
    best,
    runId,
    onEat,
    onDie,
    restart,
  };
}
