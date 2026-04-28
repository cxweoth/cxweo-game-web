'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { GalaxianCanvas } from './GalaxianCanvas';
import { useGalaxian } from './useGalaxian';
import { CFG } from './types';

export function Galaxian() {
  const { status, score, lives, wave, best, onScore, onDamage, onWaveCleared, restart } =
    useGalaxian();
  const [resetKey, setResetKey] = useState(0);

  // 同步 restart + 重建 World;確保 React 把兩個 state 一起 batch
  const handleRestart = useCallback(() => {
    restart();
    setResetKey((k) => k + 1);
  }, [restart]);

  const isOver = status === 'gameOver';
  const isBest = isOver && best === score && score > 0;

  return (
    <GameShell
      title="小蜜蜂"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleRestart}>
            重玩
          </Button>
          <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border-2 border-zinc-300 bg-white px-4 py-2 text-base font-medium dark:border-zinc-700 dark:bg-zinc-900">
            <span>
              分數 <strong className="font-mono text-lg tabular-nums">{score}</strong>
            </span>
            <span className="text-zinc-400">·</span>
            <span>
              第 <strong className="font-mono text-lg tabular-nums">{wave}</strong> 波
            </span>
            <span className="text-zinc-400">·</span>
            <span>
              命 <strong className="font-mono text-lg tabular-nums">{lives}</strong> / {CFG.maxLives}
            </span>
            {best !== null ? (
              <>
                <span className="text-zinc-400">·</span>
                <span className="text-zinc-600 dark:text-zinc-400">最高紀錄 {best}</span>
              </>
            ) : null}
          </div>
        </div>
      }
      instructions={
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>手機 / 觸控</strong>:畫面下方左側 <kbd>←</kbd> <kbd>→</kbd> 控制移動,右側紅色 <kbd>🔫 射擊</kbd> 按住連射;也可以用手指在遊戲畫面內滑動只移動(放開停)
          </li>
          <li>
            <strong>桌機鍵盤</strong>:<kbd>←</kbd><kbd>→</kbd> 或 <kbd>A</kbd><kbd>D</kbd> 移動;<kbd>空白鍵</kbd> / <kbd>↑</kbd> / <kbd>W</kbd> 射擊(場上最多 4 發)
          </li>
          <li>
            <strong>計分</strong>:站立蜜蜂 +10、俯衝中蜜蜂 +50、紅色隊長 ×2 倍分、整波清空額外 +500
          </li>
          <li>
            <strong>勝負</strong>:全滅進下一波,蜜蜂越來越快、整體下移;被蜜蜂或炸彈撞到 -1 命,3 命用完結束
          </li>
        </ul>
      }
    >
      <GalaxianCanvas
        status={status}
        score={score}
        best={best}
        lives={lives}
        wave={wave}
        onScore={onScore}
        onDamage={onDamage}
        onWaveCleared={onWaveCleared}
        resetKey={resetKey}
      >
        {isOver ? (
          <ResultPanel score={score} best={best} isBest={isBest} onRestart={handleRestart} />
        ) : null}
      </GalaxianCanvas>
    </GameShell>
  );
}

/** 遊戲結束面板 — 浮在 canvas 中央 */
function ResultPanel({
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
      role="dialog"
      aria-live="polite"
      className={cn(
        'absolute inset-0 flex items-center justify-center',
        'bg-black/55',
        'pointer-events-auto',
      )}
    >
      <div
        className={cn(
          'flex w-[78%] max-w-[320px] flex-col items-center gap-3',
          'rounded-2xl border-4 px-6 py-5 text-center shadow-2xl',
          'border-amber-400 bg-amber-50 text-amber-900',
          'dark:border-amber-500/70 dark:bg-zinc-900 dark:text-amber-100',
        )}
      >
        <span className="text-3xl" aria-hidden>
          🐝
        </span>
        <h2 className="text-xl font-bold leading-none">遊戲結束</h2>
        <div className="flex flex-col gap-1 text-base">
          <div>
            分數 <strong className="font-mono text-lg tabular-nums">{score}</strong>
          </div>
          {isBest ? (
            <div className="rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-semibold text-white">
              🏆 刷新紀錄!
            </div>
          ) : best !== null ? (
            <div className="opacity-80">
              最高紀錄 <span className="font-mono tabular-nums">{best}</span>
            </div>
          ) : null}
        </div>
        <Button size="lg" onClick={onRestart} className="mt-1 w-full">
          再來一次
        </Button>
      </div>
    </div>
  );
}
