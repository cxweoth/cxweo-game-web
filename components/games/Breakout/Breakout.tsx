'use client';

import { Button } from '@/components/ui/Button';
import { ScoreBoard } from '@/components/ui/ScoreBoard';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { BreakoutCanvas } from './BreakoutCanvas';
import { useBreakout } from './useBreakout';

export function Breakout() {
  const {
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
  } = useBreakout();

  const isIdle = status === 'idle';
  const isOver = status === 'gameOver';
  const isBest = isOver && best !== null && best === score && score > 0;

  return (
    <GameShell
      title="打磚塊"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={start}>
            {isIdle ? '開始遊戲' : '重玩'}
          </Button>
          <div className="ml-auto">
            <ScoreBoard
              score={score}
              best={best ?? 0}
              extras={[
                { label: 'LIVES', value: '❤'.repeat(Math.max(0, lives)) || '—' },
                { label: 'LEVEL', value: level },
              ]}
            />
          </div>
        </div>
      }
      instructions={
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>移動板子</strong>:滑鼠 / 觸控拖曳跟手;鍵盤 <kbd>←</kbd>{' '}
            <kbd>→</kbd> 或 <kbd>A</kbd><kbd>D</kbd>。
          </li>
          <li>
            開始後球會在板上停 0.8 秒(可調整位置),時間到自動發球。打掉所有磚塊進入下一關。
          </li>
          <li>球從中央打板子會直上,從邊緣打會斜飛(角度由命中位置決定)。</li>
          <li>
            打磚塊每塊 +10 ~ +50(越上面分越多);每升一關球速 +10%、板子縮短。
          </li>
          <li>共 {3} 命;球掉到底部 −1 命,歸零即遊戲結束。</li>
        </ul>
      }
    >
      {isIdle ? (
        <div className="mb-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
          按「開始遊戲」開始第 1 關。
        </div>
      ) : null}

      {isOver ? (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm',
            'border-red-300 bg-red-50 text-red-900 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200',
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg" aria-hidden>
              💥
            </span>
            <span className="font-semibold">遊戲結束</span>
            <span className="opacity-80">
              分數 {score} ・ 抵達 Level {level}
            </span>
            {isBest ? (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                🏆 刷新紀錄
              </span>
            ) : best !== null ? (
              <span className="opacity-80">最佳 {best}</span>
            ) : null}
          </div>
          <Button size="sm" onClick={start}>
            再玩一次
          </Button>
        </div>
      ) : null}

      <BreakoutCanvas
        status={status}
        level={level}
        onBrickHit={onBrickHit}
        onLifeLost={onLifeLost}
        onLevelClear={onLevelClear}
        resetKey={runId}
      />
    </GameShell>
  );
}
