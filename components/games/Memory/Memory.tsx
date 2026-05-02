'use client';

import { Button } from '@/components/ui/Button';
import { ScoreBoard } from '@/components/ui/ScoreBoard';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { useMemory } from './useMemory';
import { DIFFICULTIES, totalPairs, type Card, type Difficulty } from './types';

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.min(99 * 60 + 59, seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export function Memory() {
  const { state, config, elapsed, best, flip, reset } = useMemory('easy');

  const isOver = state.status === 'gameOver';
  const justBroke = isOver && best !== null && best === elapsed;

  return (
    <GameShell
      title="記憶翻牌"
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
                onClick={() => reset(d)}
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
          <Button variant="secondary" size="sm" onClick={() => reset()}>
            重新發牌
          </Button>
          <div className="ml-auto">
            <ScoreBoard
              score={state.matched}
              extras={[
                { label: 'PAIRS', value: `${state.matched}/${totalPairs(state.difficulty)}` },
                { label: 'MOVES', value: state.attempts },
                { label: 'TIME', value: formatTime(elapsed) },
                { label: 'BEST', value: best === null ? '—' : formatTime(best) },
              ]}
            />
          </div>
        </div>
      }
      instructions={
        <ul className="list-disc space-y-1 pl-5">
          <li>點兩張卡;若圖案相同則配對成功留下,不同則蓋回去。</li>
          <li>把所有對都配完即勝利;用時越短越好。</li>
          <li>同一張卡點兩次或卡片正在翻回時的點擊會被忽略。</li>
          <li>三難度卡片數:初級 12 / 中級 16 / 高級 24,各自獨立紀錄最佳時間。</li>
        </ul>
      }
    >
      {isOver ? (
        <div
          role="status"
          aria-live="polite"
          className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg" aria-hidden>
              🎉
            </span>
            <span className="font-semibold">全配對完成!</span>
            <span className="opacity-80">
              {config.label}・用時 {formatTime(elapsed)} ・ {state.attempts} 次嘗試
            </span>
            {justBroke ? (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                🏆 刷新紀錄
              </span>
            ) : best !== null ? (
              <span className="opacity-80">最佳 {formatTime(best)}</span>
            ) : null}
          </div>
          <Button size="sm" onClick={() => reset()}>
            再來一局
          </Button>
        </div>
      ) : null}

      <div
        className="mx-auto grid w-full max-w-2xl gap-2 sm:gap-3"
        style={{
          gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
        }}
      >
        {state.cards.map((c) => (
          <CardView key={c.id} card={c} onFlip={() => flip(c.id)} />
        ))}
      </div>
    </GameShell>
  );
}

function CardView({ card, onFlip }: { card: Card; onFlip: () => void }) {
  const isUp = card.state === 'up' || card.state === 'matched';
  const matched = card.state === 'matched';

  return (
    <button
      type="button"
      onClick={onFlip}
      disabled={isUp}
      aria-label={isUp ? `已翻開:${card.symbol}` : '蓋住的卡'}
      className={cn(
        'relative aspect-[3/4] select-none rounded-lg',
        'transition-transform active:scale-95',
        // 用 perspective 讓 inner 翻面時有 3D 感
      )}
      style={{ perspective: '1000px' }}
    >
      <div
        className={cn(
          'relative h-full w-full transition-transform duration-300 ease-out',
          isUp ? '[transform:rotateY(180deg)]' : '',
        )}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* 背面:藏起來的問號 */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-lg',
            'bg-gradient-to-br from-indigo-500 to-purple-600 text-white',
            'shadow-md ring-2 ring-indigo-400/50',
            'text-3xl font-bold sm:text-4xl',
          )}
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          ?
        </div>
        {/* 正面:emoji 圖示 */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-lg',
            'bg-white dark:bg-zinc-100 shadow-md',
            matched
              ? 'ring-2 ring-emerald-400 dark:ring-emerald-500'
              : 'ring-1 ring-zinc-300',
            'text-3xl sm:text-5xl',
          )}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <span className={cn(matched && 'opacity-90')}>{card.symbol}</span>
        </div>
      </div>
    </button>
  );
}
