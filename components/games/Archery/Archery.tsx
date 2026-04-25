'use client';

import { Button } from '@/components/ui/Button';
import { ScoreBoard } from '@/components/ui/ScoreBoard';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { ArcheryCanvas } from './ArcheryCanvas';
import { useArchery } from './useArchery';
import { CFG } from './types';

function fmtWind(w: number): string {
  if (w === 0) return '—';
  return `${w > 0 ? '→' : '←'} ${Math.abs(Math.round(w))}`;
}

export function Archery() {
  const { status, shots, wind, best, totalScore, recordShot, restart } = useArchery();
  const isOver = status === 'gameOver';
  const isBest = isOver && best === totalScore;

  return (
    <GameShell
      title="射箭"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={restart}>
            重玩
          </Button>
          <div className="ml-auto">
            <ScoreBoard
              score={totalScore}
              best={best}
              extras={[
                { label: 'ARROWS', value: `${shots.length}/${CFG.arrowsPerRound}` },
                { label: 'WIND', value: fmtWind(wind) },
              ]}
            />
          </div>
        </div>
      }
      instructions={
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>瞄準</strong>：滑鼠上下移動 / 鍵盤 <kbd>↑</kbd><kbd>↓</kbd>（畫面上半 = 高仰角）
          </li>
          <li>
            <strong>蓄力射出</strong>：按住滑鼠左鍵 / <kbd>Space</kbd> 或 <kbd>Enter</kbd>，蓄越久飛越遠；放開射出
          </li>
          <li>
            <strong>計分</strong>：命中 1–10 環分（黃心 10 分），脫靶 0 分；5 箭一輪總分 0–50
          </li>
          <li>每箭風向不同，蓄力時的虛線會即時預測落點</li>
        </ul>
      }
    >
      {isOver ? <Banner totalScore={totalScore} best={best} isBest={isBest} onRestart={restart} /> : null}

      <ArcheryCanvas
        wind={wind}
        shotsLanded={shots}
        disabled={isOver}
        onShot={recordShot}
      />

      <ShotsStrip shots={shots} />
    </GameShell>
  );
}

function Banner({
  totalScore,
  best,
  isBest,
  onRestart,
}: {
  totalScore: number;
  best: number | null;
  isBest: boolean;
  onRestart: () => void;
}) {
  const tone: 'pos' | 'neu' | 'neg' = totalScore >= 35 ? 'pos' : totalScore >= 20 ? 'neu' : 'neg';
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
          🏹
        </span>
        <span className="font-semibold">本輪結束 · 總分 {totalScore} / 50</span>
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

/** 畫面下方顯示「每箭得分」的小列表，邊打邊看 */
function ShotsStrip({
  shots,
}: {
  shots: ReadonlyArray<{ score: number }>;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {Array.from({ length: CFG.arrowsPerRound }, (_, i) => {
        const shot = shots[i];
        return (
          <div
            key={i}
            className={cn(
              'flex h-9 min-w-[3.25rem] items-center justify-center rounded-md border px-3 text-sm font-mono font-semibold tabular-nums',
              shot
                ? 'border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'
                : 'border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-600',
            )}
          >
            {shot ? shot.score : `#${i + 1}`}
          </div>
        );
      })}
    </div>
  );
}
