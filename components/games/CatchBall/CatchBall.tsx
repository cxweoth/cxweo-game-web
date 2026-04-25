'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { CatchBallCanvas } from './CatchBallCanvas';
import { useCatchBall } from './useCatchBall';
import { CFG } from './types';

export function CatchBall() {
  const { status, score, lives, best, onCatch, onMiss, restart } = useCatchBall();

  // resetKey 通知 Canvas 重置 World
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    if (status === 'playing') setResetKey((k) => k + 1);
  }, [status]);

  const isOver = status === 'gameOver';
  const isBest = isOver && best === score && score > 0;

  return (
    <GameShell
      title="接球"
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
              ❤️ <strong className="font-mono tabular-nums">{lives}</strong> / {CFG.maxLives}
            </span>
            {best !== null ? (
              <>
                <span className="text-zinc-400">·</span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  最佳 {best}
                </span>
              </>
            ) : null}
          </div>
        </div>
      }
      instructions={
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>移動</strong>:滑鼠 / 觸控拖曳 = 籃子跟隨;鍵盤 <kbd>←</kbd><kbd>→</kbd> 或 <kbd>A</kbd><kbd>D</kbd>
          </li>
          <li>
            <strong>計分</strong>:接到普通彩球 +1、金球 +5;漏球扣 1 ❤,3 顆歸 0 結束
          </li>
          <li>球速與生成頻率會隨「累計接球數」逐漸加快,最多到 3 倍速</li>
        </ul>
      }
    >
      {isOver ? (
        <ResultBanner score={score} best={best} isBest={isBest} onRestart={restart} />
      ) : null}

      <CatchBallCanvas
        status={status}
        score={score}
        lives={lives}
        best={best}
        onCatch={onCatch}
        onMiss={onMiss}
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
  const tone: 'pos' | 'neu' | 'neg' = score >= 30 ? 'pos' : score >= 10 ? 'neu' : 'neg';
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm',
        tone === 'pos' &&
          'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200',
        tone === 'neu' &&
          'border-zinc-300 bg-zinc-50 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200',
        tone === 'neg' &&
          'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-lg" aria-hidden>
          🏀
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
        再玩一次
      </Button>
    </div>
  );
}
