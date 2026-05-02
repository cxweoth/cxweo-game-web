'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getHighScore, setHighScore } from '@/lib/storage';
import { CFG, SLUG, makeHoles, type Hole } from './types';

type Status = 'idle' | 'playing' | 'gameOver';

/**
 * 用單一 rAF 迴圈推進 holes 狀態 + 倒數 + spawn,避免動畫主迴圈用 setInterval。
 *
 * setHoles 一直被呼叫,但若沒有狀態變化就回傳 prev 參考,React 內部
 * Object.is 比較會跳過 re-render。timeLeft 只在 ceil 整秒變動時才會更新。
 */
export function useWhackAMole() {
  const [status, setStatus] = useState<Status>('idle');
  const [score, setScore] = useState<number>(0);
  const [hits, setHits] = useState<number>(0);
  const [misses, setMisses] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(CFG.roundSeconds);
  const [holes, setHoles] = useState<Hole[]>(() => makeHoles());
  const [best, setBest] = useState<number | null>(null);

  // 給結算時讀最終分數(setState 在同一 turn 讀回是舊值)
  const scoreRef = useRef<number>(0);
  const startAtRef = useRef<number>(0);

  useEffect(() => {
    setBest(getHighScore(SLUG));
  }, []);

  const start = useCallback(() => {
    scoreRef.current = 0;
    setScore(0);
    setHits(0);
    setMisses(0);
    setTimeLeft(CFG.roundSeconds);
    setHoles(makeHoles());
    startAtRef.current = performance.now();
    setStatus('playing');
  }, []);

  // rAF 迴圈:狀態轉換 + 自動下沉 + 定時 spawn + 倒數 + 結算
  useEffect(() => {
    if (status !== 'playing') return;
    let raf = 0;
    let lastSpawnAt = performance.now();
    let nextSpawnDelay = CFG.spawnMaxMs;

    const tick = (now: number) => {
      const elapsedSec = (now - startAtRef.current) / 1000;
      const left = Math.max(0, CFG.roundSeconds - elapsedSec);
      setTimeLeft(Math.ceil(left));

      if (left <= 0) {
        // 結算:只在這裡讀 scoreRef,避免 React state 還沒更新到位
        const final = scoreRef.current;
        const updated = setHighScore(SLUG, final);
        if (updated) setBest(final);
        setStatus('gameOver');
        raf = 0;
        return;
      }

      // 隨進度線性遞減 spawn 間隔與 pop 持續時間
      const progress = Math.min(1, elapsedSec / CFG.roundSeconds);
      const popDur =
        CFG.popMaxMs - (CFG.popMaxMs - CFG.popMinMs) * progress;

      setHoles((prev) => {
        let changed = false;
        const next = prev.map((h) => {
          if (h.state === 'up' && now >= h.popUntil) {
            changed = true;
            return { state: 'fled' as const, popUntil: 0, changedAt: now };
          }
          if (
            (h.state === 'fled' || h.state === 'whacked') &&
            now - h.changedAt >= CFG.cooldownMs
          ) {
            changed = true;
            return { state: 'down' as const, popUntil: 0, changedAt: 0 };
          }
          return h;
        });

        // 嘗試 spawn 一隻
        if (now - lastSpawnAt >= nextSpawnDelay) {
          const downIdx: number[] = [];
          for (let i = 0; i < next.length; i++) {
            if (next[i]!.state === 'down') downIdx.push(i);
          }
          if (downIdx.length > 0) {
            const pickIdx = downIdx[Math.floor(Math.random() * downIdx.length)]!;
            next[pickIdx] = {
              state: 'up',
              popUntil: now + popDur,
              changedAt: now,
            };
            changed = true;
          }
          lastSpawnAt = now;
          nextSpawnDelay =
            CFG.spawnMaxMs - (CFG.spawnMaxMs - CFG.spawnMinMs) * progress;
        }

        return changed ? next : prev;
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [status]);

  const whack = useCallback(
    (idx: number) => {
      if (status !== 'playing') return;
      setHoles((prev) => {
        const h = prev[idx];
        if (!h) return prev;
        if (h.state === 'up') {
          scoreRef.current += CFG.hitScore;
          setScore(scoreRef.current);
          setHits((n) => n + 1);
          const next = [...prev];
          next[idx] = {
            state: 'whacked',
            popUntil: 0,
            changedAt: performance.now(),
          };
          return next;
        }
        if (h.state === 'down') {
          // 點空地扣分(不到 0)
          scoreRef.current = Math.max(0, scoreRef.current - CFG.missPenalty);
          setScore(scoreRef.current);
          setMisses((n) => n + 1);
        }
        // whacked / fled 期間的點擊忽略
        return prev;
      });
    },
    [status],
  );

  return { status, score, hits, misses, timeLeft, holes, best, start, whack };
}
