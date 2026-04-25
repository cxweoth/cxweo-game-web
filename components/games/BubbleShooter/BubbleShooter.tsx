'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { BubbleShooterCanvas } from './BubbleShooterCanvas';
import { useBubbleShooter } from './useBubbleShooter';

export function BubbleShooter() {
  const { status, score, best, onScore, onGameOver, onWin, restart } = useBubbleShooter();
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    if (status === 'playing') setResetKey((k) => k + 1);
  }, [status]);

  const isOver = status !== 'playing';
  const isBest = isOver && best === score && score > 0;

  return (
    <GameShell
      title="泡泡連消"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={restart}>
            重玩
          </Button>
          <div className="ml-auto flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <span>
              分數 <strong className="font-mono tabular-nums">{score}</strong>
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
            <strong>瞄準</strong>:滑鼠 / 觸控位置 = 砲管方向;鍵盤 <kbd>←</kbd><kbd>→</kbd> 微調
          </li>
          <li>
            <strong>射出</strong>:點擊 / <kbd>Space</kbd>;子彈會從砲口飛出,撞牆會反彈
          </li>
          <li>
            落點 3 顆同色相連 → 全部消除 +10 分/顆;脫離頂部的漂浮泡泡掉落 +20 分/顆
          </li>
          <li>
            連續 7 次未消除 → 整盤往下推一列;泡泡碰到紅色虛線 → 失敗
          </li>
        </ul>
      }
    >
      {isOver ? (
        <ResultBanner status={status} score={score} best={best} isBest={isBest} onRestart={restart} />
      ) : null}

      <BubbleShooterCanvas
        status={status}
        score={score}
        best={best}
        onScore={onScore}
        onGameOver={onGameOver}
        onWin={onWin}
        resetKey={resetKey}
      />
    </GameShell>
  );
}

function ResultBanner({
  status,
  score,
  best,
  isBest,
  onRestart,
}: {
  status: 'gameOver' | 'win' | 'playing';
  score: number;
  best: number | null;
  isBest: boolean;
  onRestart: () => void;
}) {
  const win = status === 'win';
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
          {win ? '🎉' : '💥'}
        </span>
        <span className="font-semibold">
          {win ? '清盤勝利!' : '泡泡爆滿了'} · 分數 {score}
        </span>
        {isBest ? (
          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
            🏆 刷新紀錄
          </span>
        ) : best !== null ? (
          <span className="opacity-80">最佳 {best}</span>
        ) : null}
      </div>
      <Button size="sm" onClick={onRestart}>
        再來一輪
      </Button>
    </div>
  );
}
