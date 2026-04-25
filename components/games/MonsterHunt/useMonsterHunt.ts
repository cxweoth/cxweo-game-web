'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { readJSON, writeJSON } from '@/lib/storage';
import { CFG, SLUG, emptyStats, type Result, type Stats } from './types';

const STATS_KEY = `${SLUG}:stats`;

/**
 * 回合層級狀態。物理（玩家位置、子彈、碰撞偵測）由 MonsterHuntCanvas
 * 用 rAF + refs 自己處理，這個 hook 只關心：
 *   - 玩家 HP / 怪物 HP
 *   - 遊戲結束與結果
 *   - 累計勝負（localStorage）
 */
export function useMonsterHunt() {
  const [status, setStatus] = useState<'playing' | 'gameOver'>('playing');
  const [result, setResult] = useState<Result>(null);
  const [playerHP, setPlayerHP] = useState<number>(CFG.playerHP);
  const [monsterHP, setMonsterHP] = useState<number>(CFG.monsterHP);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [hydrated, setHydrated] = useState(false);

  // statsRef：避免 onMonsterHit / onPlayerHit 的閉包讀到舊 stats
  const statsRef = useRef<Stats>(emptyStats);

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

  /** 怪物挨一箭。回傳是否本擊終結遊戲（讓 Canvas 可立即停止輸入） */
  const onMonsterHit = useCallback(() => {
    setMonsterHP((hp) => {
      const next = Math.max(0, hp - 1);
      if (next === 0) {
        setStatus('gameOver');
        setResult('win');
        persistStats({ ...statsRef.current, wins: statsRef.current.wins + 1 });
      }
      return next;
    });
  }, [persistStats]);

  /** 玩家挨一發火球 */
  const onPlayerHit = useCallback(() => {
    setPlayerHP((hp) => {
      const next = Math.max(0, hp - 1);
      if (next === 0) {
        setStatus('gameOver');
        setResult('lose');
        persistStats({ ...statsRef.current, losses: statsRef.current.losses + 1 });
      }
      return next;
    });
  }, [persistStats]);

  const restart = useCallback(() => {
    setStatus('playing');
    setResult(null);
    setPlayerHP(CFG.playerHP);
    setMonsterHP(CFG.monsterHP);
  }, []);

  return {
    status,
    result,
    playerHP,
    monsterHP,
    stats,
    hydrated,
    onMonsterHit,
    onPlayerHit,
    restart,
  };
}
