'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ScoreBoard } from '@/components/ui/ScoreBoard';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { getBestTime, setBestTime } from '@/lib/storage';
import { MineBoard } from './MineBoard';
import { useMinesweeper } from './useMinesweeper';
import { DIFFICULTIES, type Difficulty } from './types';

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.min(999 * 60 + 59, seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

const bestKey = (d: Difficulty) => `minesweeper:${d}`;

export function Minesweeper() {
  const { state, elapsed, config, isWin, reveal, flag, moveCursor, restart } =
    useMinesweeper('easy');

  // 最佳時間：每次難度切換 / 結算更新時重讀
  const [best, setBestState] = useState<number | null>(null);
  useEffect(() => {
    setBestState(getBestTime(bestKey(state.difficulty)));
  }, [state.difficulty]);

  // 勝利時寫入最佳紀錄
  useEffect(() => {
    if (state.status !== 'gameOver' || !isWin) return;
    const updated = setBestTime(bestKey(state.difficulty), elapsed);
    if (updated) setBestState(elapsed);
  }, [state.status, isWin, elapsed, state.difficulty]);

  const minesLeft = Math.max(0, config.mines - state.flags);
  const isGameOver = state.status === 'gameOver';
  const justBroke = isWin && best === elapsed;

  return (
    <GameShell
      title="踩地雷"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900"
            role="group"
            aria-label="難度選擇"
          >
            {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => restart(d)}
                className={cn(
                  'h-8 rounded px-3 text-sm font-medium transition-colors',
                  state.difficulty === d
                    ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800',
                )}
                aria-pressed={state.difficulty === d}
              >
                {DIFFICULTIES[d].label}
              </button>
            ))}
          </div>

          <Button variant="secondary" size="sm" onClick={() => restart()}>
            重玩
          </Button>

          <div className="ml-auto">
            <ScoreBoard
              score={minesLeft}
              extras={[
                { label: 'TIME', value: formatTime(elapsed) },
                { label: 'BEST', value: best === null ? '—' : formatTime(best) },
              ]}
            />
          </div>
        </div>
      }
      instructions={
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>翻開格子</strong>：左鍵 / 點擊 / <kbd>Space</kbd> 或 <kbd>Enter</kbd>
          </li>
          <li>
            <strong>插旗</strong>：右鍵 / 長按 / <kbd>F</kbd>
          </li>
          <li>
            <strong>移動游標</strong>：方向鍵 <kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd>
          </li>
          <li>
            數字代表周圍 8 格的地雷數；翻開所有非雷格即勝利。首次點擊保證安全。
          </li>
        </ul>
      }
    >
      {isGameOver ? (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm',
            isWin
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200'
              : 'border-red-300 bg-red-50 text-red-900 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200',
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden>
              {isWin ? '🎉' : '💥'}
            </span>
            <span className="font-semibold">
              {isWin ? '勝利！' : '踩到地雷了'}
            </span>
            {isWin ? (
              <>
                <span className="opacity-80">
                  {config.label}・用時 {formatTime(elapsed)}
                </span>
                {justBroke ? (
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                    🏆 刷新紀錄
                  </span>
                ) : best !== null ? (
                  <span className="opacity-80">目前最佳 {formatTime(best)}</span>
                ) : null}
              </>
            ) : (
              <span className="opacity-80">再試一次,首擊永遠安全。</span>
            )}
          </div>
          <Button size="sm" onClick={() => restart()}>
            再玩一次
          </Button>
        </div>
      ) : null}

      <div className="flex justify-center">
        <MineBoard
          board={state.board}
          config={config}
          cursor={state.cursor}
          disabled={isGameOver}
          onReveal={reveal}
          onFlag={flag}
          onMoveCursor={moveCursor}
        />
      </div>
    </GameShell>
  );
}
