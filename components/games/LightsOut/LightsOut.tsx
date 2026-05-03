'use client';

import { Button } from '@/components/ui/Button';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { useLightsOut } from './useLightsOut';
import { SIZE, type Difficulty } from './types';

const DIFF_LABEL: Record<Difficulty, string> = {
  easy: '初級',
  normal: '中級',
  hard: '高級',
};

export function LightsOut() {
  const { board, moves, diff, best, cleared, click, newPuzzle } = useLightsOut();
  const litCount = board.filter((b) => b).length;

  return (
    <GameShell
      title="關燈"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
            {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => newPuzzle(d)}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                  diff === d
                    ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
                )}
              >
                {DIFF_LABEL[d]}
              </button>
            ))}
          </div>

          <Button variant="secondary" size="sm" onClick={() => newPuzzle()}>
            新題目
          </Button>

          <div className="ml-auto flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <Field label="MOVES" value={moves} />
            <Field label="LIT" value={`${litCount}/25`} />
            <Field label="BEST" value={best[diff] === null ? '—' : best[diff]!} />
          </div>
        </div>
      }
      instructions={
        <ul className="list-disc space-y-1 pl-5">
          <li>
            點任一格會 <strong>翻轉</strong>該格與
            <strong> 上下左右 4 鄰</strong>(亮↔暗)的狀態。
          </li>
          <li>把所有燈關掉就過關;步數越少越好,每難度各自記錄最佳步數。</li>
          <li>
            初級 / 中級 / 高級 對應越多次「亂點」生成題目,難度逐步上升;但保證可解。
          </li>
        </ul>
      }
    >
      {cleared ? (
        <div
          role="status"
          aria-live="polite"
          className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg" aria-hidden>
              💡
            </span>
            <span className="font-semibold">全暗!</span>
            <span className="opacity-80">
              {moves} 步
              {best[diff] !== null && best[diff] === moves ? ' ・ 🏆 最佳' : ''}
            </span>
          </div>
          <Button size="sm" onClick={() => newPuzzle()}>
            下一題
          </Button>
        </div>
      ) : null}

      <div
        className="mx-auto grid w-full max-w-md gap-2"
        style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}
        role="grid"
        aria-label="5x5 燈板"
      >
        {board.map((lit, i) => (
          <button
            key={i}
            type="button"
            onClick={() => click(i)}
            disabled={cleared}
            aria-label={`第 ${i + 1} 格 ${lit ? '亮' : '暗'}`}
            className={cn(
              'aspect-square rounded-lg shadow-md transition-all',
              'cursor-pointer active:scale-95 disabled:cursor-default',
              lit
                ? 'bg-yellow-400 ring-4 ring-yellow-200 dark:bg-amber-300 dark:ring-amber-200/40'
                : 'bg-zinc-700 ring-1 ring-zinc-600/50 dark:bg-zinc-800 dark:ring-zinc-700',
            )}
          >
            <span aria-hidden className={cn('text-3xl', lit ? '' : 'opacity-30')}>
              {lit ? '💡' : '⚫'}
            </span>
          </button>
        ))}
      </div>
    </GameShell>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span className="font-mono text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}
