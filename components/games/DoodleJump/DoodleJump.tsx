'use client';

import { Button } from '@/components/ui/Button';
import { ScoreBoard } from '@/components/ui/ScoreBoard';
import { GameShell } from '@/components/layout/GameShell';
import { DoodleJumpCanvas } from './DoodleJumpCanvas';
import { useDoodleJump } from './useDoodleJump';

export function DoodleJump() {
  const { status, score, best, runId, onScore, onDie, restart } = useDoodleJump();
  const isOver = status === 'gameOver';
  const isBest = isOver && best !== null && best === score && score > 0;

  return (
    <GameShell
      title="跳躍王"
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
            <strong>左右移動</strong>:鍵盤 <kbd>←</kbd> <kbd>→</kbd> / <kbd>A</kbd> <kbd>D</kbd>;
            手機 <strong>按住畫面左半 / 右半</strong>。
          </li>
          <li>角色自動踩平台彈跳;走出邊界會從另一側回來(side wrap)。</li>
          <li>
            平台類型:綠色一般 / <span className="text-blue-500">藍色</span>左右移動 /
            <span className="text-amber-700"> 棕色</span> 一踩就碎 /
            <span className="text-yellow-500"> 黃色</span> 彈簧(超高彈)。
          </li>
          <li>掉到畫面下方即結束;爬越高分數越高。</li>
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

      <DoodleJumpCanvas
        status={status}
        onScore={onScore}
        onDie={onDie}
        resetKey={runId}
      />
    </GameShell>
  );
}
