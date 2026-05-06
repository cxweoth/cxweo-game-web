'use client';

import { Button } from '@/components/ui/Button';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { GeoDashCanvas } from './GeoDashCanvas';
import { useGeoDash } from './useGeoDash';
import type { Mode } from './types';

export function GeoDash() {
  const {
    mode,
    status,
    stats,
    runId,
    audioMuted,
    onStart,
    onDeath,
    onWin,
    restart,
    switchMode,
    toggleAudio,
  } = useGeoDash();

  const isOver = status === 'dead' || status === 'won';
  const bestLevelText =
    stats.bestLevelMs === null ? '—' : `${(stats.bestLevelMs / 1000).toFixed(2)}s`;

  return (
    <GameShell
      title="節奏方塊"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <Group>
            <ToggleBtn active={mode === 'level'} onClick={() => switchMode('level' as Mode)}>
              關卡(Stereo Madness 風)
            </ToggleBtn>
            <ToggleBtn active={mode === 'endless'} onClick={() => switchMode('endless' as Mode)}>
              無盡模式
            </ToggleBtn>
          </Group>

          <Button variant="secondary" size="sm" onClick={restart}>
            {isOver ? '再試一次' : '重新開始'}
          </Button>

          <Button variant="ghost" size="sm" onClick={toggleAudio}>
            {audioMuted ? '🔇 音樂關' : '🎵 音樂開'}
          </Button>

          <div className="ml-auto flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900">
            {mode === 'level' ? (
              <>
                <span>通關 <strong>{stats.levelClears}</strong></span>
                <span>最快 <strong>{bestLevelText}</strong></span>
              </>
            ) : (
              <span>最遠 <strong>{stats.bestEndless}</strong> px</span>
            )}
          </div>
        </div>
      }
      instructions={
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>跳</strong>:空白 / ↑ / W / J / 點擊畫面。長按或連按 = 連跳。
          </li>
          <li>
            從上方落到方塊頂可以踩著走;碰到<strong>尖刺</strong>或撞到方塊側面就死。
          </li>
          <li>
            <strong>關卡模式</strong>:致敬 Stereo Madness 的 60 秒短關,跑到終點即勝。
            <strong> 無盡模式</strong>:挑戰最遠距離。
          </li>
        </ul>
      }
    >
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
        {status === 'idle'
          ? '準備好了就跳吧。'
          : status === 'playing'
            ? '加油!'
            : status === 'won'
              ? '通關!'
              : '失敗 — 點下面再玩一次。'}
      </div>

      <div className="relative mx-auto w-full max-w-[800px]">
        <GeoDashCanvas
          mode={mode}
          status={status}
          audioMuted={audioMuted}
          bestEndless={stats.bestEndless}
          resetKey={runId}
          onStart={onStart}
          onDeath={onDeath}
          onWin={onWin}
        />

        {(status === 'dead' || status === 'won') && (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div
              className={cn(
                'pointer-events-auto flex flex-col items-center gap-3 rounded-2xl border-2 px-8 py-6 shadow-2xl backdrop-blur-sm',
                status === 'won'
                  ? 'border-emerald-300 bg-emerald-50/95 text-emerald-900'
                  : 'border-rose-300 bg-rose-50/95 text-rose-900',
              )}
            >
              <div className="text-4xl" aria-hidden>
                {status === 'won' ? '🏆' : '💥'}
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">
                  {status === 'won' ? '通關!' : '失敗了'}
                </div>
                {status === 'won' && (
                  <div className="mt-1 text-sm opacity-80">最快 {bestLevelText}</div>
                )}
                {status === 'dead' && mode === 'endless' && (
                  <div className="mt-1 text-sm opacity-80">
                    最遠紀錄 {stats.bestEndless} px
                  </div>
                )}
              </div>
              <Button size="lg" onClick={restart}>
                {status === 'won' ? '再來一次' : '重試'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </GameShell>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
      {children}
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded px-2.5 py-1 text-xs font-medium transition-colors',
        active
          ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'
          : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
      )}
    >
      {children}
    </button>
  );
}
