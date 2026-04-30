'use client';

import { Button } from '@/components/ui/Button';
import { ScoreBoard } from '@/components/ui/ScoreBoard';
import { GameShell } from '@/components/layout/GameShell';
import { SnakeCanvas } from './SnakeCanvas';
import { useSnake } from './useSnake';

export function Snake() {
  const { status, score, foodEaten, maxLength, best, runId, onEat, onDie, restart } =
    useSnake();

  const isOver = status === 'gameOver';
  const isBest = isOver && best !== null && best === score && score > 0;

  return (
    <GameShell
      title="貪食蛇"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={restart}>
            重玩
          </Button>
          <div className="ml-auto">
            <ScoreBoard
              score={score}
              best={best ?? 0}
              extras={[
                { label: 'FOOD', value: foodEaten },
                { label: 'LEN', value: maxLength },
              ]}
            />
          </div>
        </div>
      }
      instructions={
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>轉向</strong>:方向鍵 <kbd>←</kbd> <kbd>↑</kbd> <kbd>↓</kbd>{' '}
            <kbd>→</kbd> 或 <kbd>WASD</kbd>;手機在棋盤上滑動。
          </li>
          <li>
            吃到紅蘋果 <strong>+10</strong> 分,身體加長一節,蛇速加快(每食物
            −5ms,封底 75ms)。
          </li>
          <li>撞牆或撞到自己身體 → 遊戲結束。</li>
          <li>
            可在一格內連按兩次轉向(會緩衝);但 <strong>180°</strong>{' '}
            反向會被忽略(避免立刻撞自己)。
          </li>
        </ul>
      }
    >
      {isOver ? (
        <div
          role="status"
          aria-live="polite"
          className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg" aria-hidden>
              💥
            </span>
            <span className="font-semibold">遊戲結束</span>
            <span className="opacity-80">
              分數 {score} ・ 吃了 {foodEaten} 顆 ・ 長 {maxLength} 節
            </span>
            {isBest ? (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                🏆 刷新紀錄
              </span>
            ) : best !== null ? (
              <span className="opacity-80">最佳 {best}</span>
            ) : null}
          </div>
          <Button size="sm" onClick={restart}>
            再玩一次
          </Button>
        </div>
      ) : null}

      <SnakeCanvas status={status} onEat={onEat} onDie={onDie} resetKey={runId} />
    </GameShell>
  );
}
