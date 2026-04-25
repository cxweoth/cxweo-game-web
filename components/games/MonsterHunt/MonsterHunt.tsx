'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { MonsterHuntCanvas } from './MonsterHuntCanvas';
import { useMonsterHunt } from './useMonsterHunt';
import { CFG, type Stats } from './types';

export function MonsterHunt() {
  const {
    status,
    result,
    playerHP,
    monsterHP,
    stats,
    onMonsterHit,
    onPlayerHit,
    restart,
  } = useMonsterHunt();

  // resetKey 用來通知 Canvas 重置物理狀態
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    if (status === 'playing') setResetKey((k) => k + 1);
  }, [status]);

  return (
    <GameShell
      title="弓手獵怪"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={restart}>
            重玩
          </Button>
          <div className="ml-auto flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <span>
              玩家 ❤️ <strong className="font-mono tabular-nums">{playerHP}</strong> / {CFG.playerHP}
            </span>
            <span className="text-zinc-400">·</span>
            <span>
              怪物 💚 <strong className="font-mono tabular-nums">{monsterHP}</strong> / {CFG.monsterHP}
            </span>
          </div>
        </div>
      }
      instructions={
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>移動</strong>:滑鼠 / 觸控移動 = 玩家垂直跟隨;鍵盤 <kbd>↑</kbd><kbd>↓</kbd> 或 <kbd>W</kbd><kbd>S</kbd>
          </li>
          <li>
            <strong>射箭</strong>:點擊畫布 / <kbd>Space</kbd> / <kbd>Enter</kbd>(冷卻 320ms)
          </li>
          <li>
            <strong>勝利條件</strong>:命中怪物 5 次;<strong>失敗條件</strong>:被火球擊中 10 次
          </li>
          <li>怪物會朝玩家當下位置射火球,記得邊射邊移動閃避</li>
        </ul>
      }
    >
      {status === 'gameOver' && result ? (
        <ResultBanner result={result} stats={stats} onRestart={restart} />
      ) : null}

      <MonsterHuntCanvas
        status={status}
        playerHP={playerHP}
        monsterHP={monsterHP}
        onMonsterHit={onMonsterHit}
        onPlayerHit={onPlayerHit}
        resetKey={resetKey}
      />

      <StatsCard stats={stats} />
    </GameShell>
  );
}

function ResultBanner({
  result,
  stats,
  onRestart,
}: {
  result: 'win' | 'lose';
  stats: Stats;
  onRestart: () => void;
}) {
  const win = result === 'win';
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm',
        win
          ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200'
          : 'border-red-300 bg-red-50 text-red-900 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-lg" aria-hidden>
          {win ? '🎉' : '💀'}
        </span>
        <span className="font-semibold">{win ? '怪物已被擊敗!' : '你被擊敗了'}</span>
        <span className="opacity-80">
          累計:{stats.wins} 勝 / {stats.losses} 敗
        </span>
      </div>
      <Button size="sm" onClick={onRestart}>
        再戰一次
      </Button>
    </div>
  );
}

function StatsCard({ stats }: { stats: Stats }) {
  const total = stats.wins + stats.losses;
  const winRate = total === 0 ? 0 : Math.round((stats.wins / total) * 100);
  return (
    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
      <Stat label="勝場" value={stats.wins} />
      <Stat label="敗場" value={stats.losses} />
      <Stat label="勝率" value={`${winRate}%`} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      <div className="font-mono text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
