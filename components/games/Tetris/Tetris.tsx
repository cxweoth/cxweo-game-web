'use client';

import { Button } from '@/components/ui/Button';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { TetrisCanvas } from './TetrisCanvas';
import { useTetris } from './useTetris';

export function Tetris() {
  const {
    board,
    piece,
    ghost,
    next,
    status,
    score,
    lines,
    level,
    best,
    move,
    rotate,
    drop,
    setSoftDropActive,
    togglePause,
    restart,
  } = useTetris();

  const isOver = status === 'gameOver';
  const isBest = isOver && best === score && score > 0;

  return (
    <GameShell
      title="俄羅斯方塊"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={restart}>
            重玩
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePause}
            disabled={status === 'gameOver'}
          >
            {status === 'paused' ? '繼續' : '暫停'}
          </Button>
          <div className="ml-auto flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <span>
              分數 <strong className="font-mono tabular-nums">{score}</strong>
            </span>
            <span className="text-zinc-400">·</span>
            <span>
              行 <strong className="font-mono tabular-nums">{lines}</strong>
            </span>
            <span className="text-zinc-400">·</span>
            <span>
              等級 <strong className="font-mono tabular-nums">{level}</strong>
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
            <strong>移動</strong>:<kbd>←</kbd> <kbd>→</kbd>;
            <strong>旋轉</strong>:<kbd>↑</kbd> 或 <kbd>X</kbd>
          </li>
          <li>
            <strong>軟降</strong>(按住加速):<kbd>↓</kbd>;
            <strong>硬降</strong>(直接落到底):<kbd>Space</kbd>
          </li>
          <li>
            <strong>暫停</strong>:<kbd>P</kbd> 或 <kbd>Esc</kbd>;手機請用畫面右下方的虛擬按鍵
          </li>
          <li>消一行 100 點,雙行 300,三行 500,四行 800;均 ×等級。每 10 行升級一級。</li>
        </ul>
      }
    >
      {isOver ? (
        <ResultBanner score={score} best={best} isBest={isBest} onRestart={restart} />
      ) : null}

      <TetrisCanvas
        board={board}
        piece={piece}
        ghost={ghost}
        next={next}
        paused={status === 'paused'}
        onMove={(dx, dy) => move(dx, dy)}
        onRotate={rotate}
        onDrop={drop}
        onSoftDrop={setSoftDropActive}
        onTogglePause={togglePause}
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
        'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-lg" aria-hidden>
          🟦
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
