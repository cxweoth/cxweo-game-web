'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { StairsCanvas } from './StairsCanvas';
import { useStairs } from './useStairs';
import { CFG } from './types';

export function Stairs() {
  const { status, score, hp, best, onScore, onDamage, restart } = useStairs();
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    if (status === 'playing') setResetKey((k) => k + 1);
  }, [status]);

  const isOver = status === 'gameOver';
  const isBest = isOver && best === score && score > 0;

  return (
    <GameShell
      title="下樓梯"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={restart}>
            重玩
          </Button>
          <div className="ml-auto flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <span>
              分數 <strong className="font-mono tabular-nums">{score}</strong>
            </span>
            <span className="text-zinc-400">·</span>
            <span>
              ❤️ <strong className="font-mono tabular-nums">{hp}</strong> / {CFG.maxHP}
            </span>
            {best !== null ? (
              <>
                <span className="text-zinc-400">·</span>
                <span className="text-zinc-600 dark:text-zinc-400">最佳 {best}</span>
              </>
            ) : null}
          </div>
        </div>
      }
      instructions={
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>移動</strong>:滑鼠 / 觸控拖曳 = 角色跟隨;鍵盤 <kbd>←</kbd><kbd>→</kbd> 或 <kbd>A</kbd><kbd>D</kbd>
          </li>
          <li>
            樓梯會持續往上捲動。踩到<strong>普通木階</strong> +1 分,<strong>裂縫階</strong> +2 分(踩過會碎)。
          </li>
          <li>
            踩到<strong>紅色尖刺階</strong> −1 ❤;頭頂到上方<strong>尖刺天花板</strong>立即遊戲結束。
          </li>
        </ul>
      }
    >
      {isOver ? (
        <ResultBanner score={score} best={best} isBest={isBest} onRestart={restart} />
      ) : null}
      <StairsCanvas
        status={status}
        hp={hp}
        score={score}
        best={best}
        onScore={onScore}
        onDamage={onDamage}
        resetKey={resetKey}
      />
    </GameShell>
  );
}

function ResultBanner({
  score,
  best,
  isBest,
  onRestart,
}: {
  score: number;
  best: number | null;
  isBest: boolean;
  onRestart: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm',
        'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-lg" aria-hidden>
          🪜
        </span>
        <span className="font-semibold">遊戲結束 · 分數 {score}</span>
        {isBest ? (
          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
            🏆 刷新紀錄
          </span>
        ) : best !== null ? (
          <span className="opacity-80">最佳 {best}</span>
        ) : null}
      </div>
      <Button size="sm" onClick={onRestart}>
        再來一次
      </Button>
    </div>
  );
}
