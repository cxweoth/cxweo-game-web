'use client';

import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { Button } from '@/components/ui/Button';
import { ScoreBoard } from '@/components/ui/ScoreBoard';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { useFifteen } from './useFifteen';
import { CFG, type Direction } from './types';

const SWIPE_THRESHOLD = 28;

function formatTime(sec: number): string {
  const total = Math.max(0, sec);
  const m = Math.floor(total / 60);
  const s = (total - m * 60).toFixed(1);
  return `${m}:${s.padStart(4, '0')}`;
}

export function Fifteen() {
  const { tiles, moves, status, best, elapsedSec, move, clickTile, restart } = useFifteen();

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const swipeRef = useRef<{ x: number; y: number; id: number } | null>(null);

  // 載入時把焦點放在 wrapper,鍵盤可以直接用
  useEffect(() => {
    wrapperRef.current?.focus({ preventScroll: true });
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      let dir: Direction | null = null;
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          dir = 'up';
          break;
        case 'ArrowDown':
        case 'KeyS':
          dir = 'down';
          break;
        case 'ArrowLeft':
        case 'KeyA':
          dir = 'left';
          break;
        case 'ArrowRight':
        case 'KeyD':
          dir = 'right';
          break;
      }
      if (dir) {
        e.preventDefault();
        move(dir);
      }
    },
    [move],
  );

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    swipeRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const s = swipeRef.current;
    swipeRef.current = null;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (Math.max(ax, ay) < SWIPE_THRESHOLD) return;
    const dir: Direction =
      ax > ay ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    move(dir);
  };

  const isSolved = status === 'solved';
  const isBest = isSolved && best !== null && Math.abs(best - elapsedSec) < 0.05;

  // 9.5% gap-aware 計算用 CSS variables 在外層,每個 tile 用百分比定位
  const cellPct = 100 / CFG.size;

  return (
    <GameShell
      title="數字推盤"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={restart}>
            重新洗牌
          </Button>
          <div className="ml-auto">
            <ScoreBoard
              score={moves}
              extras={[
                { label: 'TIME', value: formatTime(elapsedSec) },
                { label: 'BEST', value: best === null ? '—' : formatTime(best) },
              ]}
            />
          </div>
        </div>
      }
      instructions={
        <ul className="list-disc space-y-1 pl-5">
          <li>把磚塊推到順序 <strong>1 → 15</strong>,空格留在右下角即完成。</li>
          <li>
            <strong>移動</strong>:點與空格相鄰的磚塊;鍵盤 <kbd>←</kbd> <kbd>↑</kbd>{' '}
            <kbd>↓</kbd> <kbd>→</kbd>(把該方向的磚塊朝空格的反方向滑);手機在棋盤上
            <strong>滑動</strong>。
          </li>
          <li>計步數與時間;最佳時間每次完成自動更新。</li>
        </ul>
      }
    >
      {isSolved ? (
        <div
          role="status"
          aria-live="polite"
          className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg" aria-hidden>
              🎉
            </span>
            <span className="font-semibold">完成!</span>
            <span className="opacity-80">
              用 {moves} 步 ・ {formatTime(elapsedSec)}
            </span>
            {isBest ? (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                🏆 最快紀錄
              </span>
            ) : best !== null ? (
              <span className="opacity-80">最佳 {formatTime(best)}</span>
            ) : null}
          </div>
          <Button size="sm" onClick={restart}>
            再來一局
          </Button>
        </div>
      ) : null}

      <div
        ref={wrapperRef}
        tabIndex={0}
        role="application"
        aria-label="15 數字推盤"
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className={cn(
          'no-focus-ring',
          'relative mx-auto aspect-square w-full max-w-md select-none touch-none',
          'rounded-xl bg-zinc-200 p-2 dark:bg-zinc-800',
          'caret-transparent',
        )}
        style={{ WebkitTapHighlightColor: 'transparent', caretColor: 'transparent' }}
      >
        {/* 空格底紋:畫 16 個淡色凹槽 */}
        {Array.from({ length: CFG.cells }).map((_, i) => (
          <div
            key={i}
            aria-hidden
            className="absolute rounded-md bg-zinc-300/80 dark:bg-zinc-900/60"
            style={{
              left: `calc(${(i % CFG.size) * cellPct}% + 4px)`,
              top: `calc(${Math.floor(i / CFG.size) * cellPct}% + 4px)`,
              width: `calc(${cellPct}% - 8px)`,
              height: `calc(${cellPct}% - 8px)`,
            }}
          />
        ))}

        {tiles.map((t) => {
          const idx = t.row * CFG.size + t.col;
          const correct = t.id === idx + 1;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => clickTile(idx)}
              aria-label={`數字 ${t.id}${correct ? ',位置正確' : ''}`}
              className={cn(
                'absolute flex items-center justify-center rounded-md font-mono font-bold tabular-nums',
                'cursor-pointer text-2xl sm:text-3xl shadow-md',
                'transition-[left,top,background-color,transform] duration-150 ease-out',
                'active:scale-95',
                correct
                  ? 'bg-emerald-500 text-white dark:bg-emerald-500'
                  : 'bg-amber-300 text-zinc-900 hover:bg-amber-200 dark:bg-amber-400',
              )}
              style={{
                left: `calc(${t.col * cellPct}% + 4px)`,
                top: `calc(${t.row * cellPct}% + 4px)`,
                width: `calc(${cellPct}% - 8px)`,
                height: `calc(${cellPct}% - 8px)`,
              }}
            >
              {t.id}
            </button>
          );
        })}
      </div>
    </GameShell>
  );
}
