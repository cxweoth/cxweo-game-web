'use client';

import { Button } from '@/components/ui/Button';
import { ScoreBoard } from '@/components/ui/ScoreBoard';
import { GameShell } from '@/components/layout/GameShell';
import { FlappyBirdCanvas } from './FlappyBirdCanvas';
import { useFlappyBird } from './useFlappyBird';

export function FlappyBird() {
  const { status, score, best, runId, onStart, onPass, onDie, restart } = useFlappyBird();

  const isOver = status === 'gameOver';
  const isBest = isOver && best !== null && best === score && score > 0;

  return (
    <GameShell
      title="跳跳鳥"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={restart}>
            重玩
          </Button>
          <div className="ml-auto">
            <ScoreBoard score={score} best={best ?? 0} />
          </div>
        </div>
      }
      instructions={
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>拍翅</strong>:點擊 / 空白鍵 / <kbd>↑</kbd> / <kbd>W</kbd>。
          </li>
          <li>
            穿過水管 +1 分。隨分數增加水管捲動會逐步加速,封底約 −260 px/s。
          </li>
          <li>撞到水管、地面或天花板 → 遊戲結束。</li>
          <li>支援滑鼠 / 觸控 / 鍵盤,手機直接點畫面就會拍翅。</li>
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
            <span className="opacity-80">分數 {score}</span>
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

      <FlappyBirdCanvas
        status={status}
        onStart={onStart}
        onPass={onPass}
        onDie={onDie}
        resetKey={runId}
      />
    </GameShell>
  );
}
