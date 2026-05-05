'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { readJSON, writeJSON } from '@/lib/storage';
import { CFG, SLUG, emptyStats, type Result, type Stats } from './types';

const STATS_KEY = `${SLUG}:stats`;

/**
 * 主 hook。HP 由 Canvas 元件的 worldRef 為 source of truth,這裡的
 * playerHP/bossHP 只用於 HUD 顯示與「HP 變動」effect 觸發點。
 *
 * restart 時 setStatus + setRunId 在同一 callback 內 batch 更新,避免兩次
 * useEffect 之間 Canvas 用舊 world 渲染一幀又被翻回 gameOver。
 */
export function useSwordDuel() {
  const [status, setStatus] = useState<'playing' | 'gameOver'>('playing');
  const [result, setResult] = useState<Result>(null);
  const [playerHP, setPlayerHP] = useState<number>(CFG.playerHP);
  const [bossHP, setBossHP] = useState<number>(CFG.bossHP);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [hydrated, setHydrated] = useState(false);
  const [runId, setRunId] = useState(0);

  const statsRef = useRef<Stats>(emptyStats);
  const settledRef = useRef(false);

  useEffect(() => {
    const loaded = { ...emptyStats, ...(readJSON<Stats>(STATS_KEY) ?? {}) };
    statsRef.current = loaded;
    setStats(loaded);
    setHydrated(true);
  }, []);

  const persistStats = useCallback((next: Stats) => {
    statsRef.current = next;
    setStats(next);
    writeJSON<Stats>(STATS_KEY, next);
  }, []);

  const onBossHPChange = useCallback((hp: number) => setBossHP(hp), []);
  const onPlayerHPChange = useCallback((hp: number) => setPlayerHP(hp), []);

  /** 結果通知;只認第一次,避免雙方同幀致命兩邊都被計入 */
  const onResultChange = useCallback(
    (r: 'win' | 'lose') => {
      if (settledRef.current) return;
      settledRef.current = true;
      setStatus('gameOver');
      setResult(r);
      const next: Stats =
        r === 'win'
          ? { ...statsRef.current, wins: statsRef.current.wins + 1 }
          : { ...statsRef.current, losses: statsRef.current.losses + 1 };
      persistStats(next);
    },
    [persistStats],
  );

  const restart = useCallback(() => {
    settledRef.current = false;
    setStatus('playing');
    setResult(null);
    setPlayerHP(CFG.playerHP);
    setBossHP(CFG.bossHP);
    setRunId((r) => r + 1);
  }, []);

  return {
    status,
    result,
    playerHP,
    bossHP,
    stats,
    hydrated,
    runId,
    onBossHPChange,
    onPlayerHPChange,
    onResultChange,
    restart,
  };
}
