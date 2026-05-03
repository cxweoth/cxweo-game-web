'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getHighScore, setHighScore } from '@/lib/storage';
import { SLUG } from './types';

/**
 * 跳跳鳥 hook — React state 只管 status / score / 最佳分;
 * 鳥的位置 / 水管 / 粒子 / 地面捲動全在 FlappyBirdCanvas 的 worldRef。
 *
 * scoreRef 與 score state 同步;onDie 結算時用 ref 拿到最終分數
 * (因為 setHighScore 與 setScore 在同一輪 dispatch,從 state 讀取會是上一個值)。
 *
 * runId 在 restart 時 +1,讓 Canvas 用它 key 在 useEffect 上重建 world。
 * 必須跟 setStatus('idle') 在同一個 callback batch,避免「再玩一次」競態。
 */
export function useFlappyBird() {
  const [status, setStatus] = useState<'idle' | 'playing' | 'gameOver'>('idle');
  const [score, setScore] = useState<number>(0);
  const [best, setBest] = useState<number | null>(null);
  const [runId, setRunId] = useState<number>(0);

  const scoreRef = useRef<number>(0);

  useEffect(() => {
    setBest(getHighScore(SLUG));
  }, []);

  const onPass = useCallback(() => {
    scoreRef.current += 1;
    setScore(scoreRef.current);
  }, []);

  const onStart = useCallback(() => {
    setStatus('playing');
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
    setStatus('idle');
    setRunId((r) => r + 1);
  }, []);

  return {
    status,
    score,
    best,
    runId,
    onStart,
    onPass,
    onDie,
    restart,
  };
}
