'use client';

import { useCallback, useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { useSokoban } from './useSokoban';
import { KEY, type Direction } from './types';

const SWIPE_THRESHOLD = 24;

export function Sokoban() {
  const {
    levels,
    levelIdx,
    levelMeta,
    stat,
    dyn,
    moves,
    cleared,
    progress,
    bestMoves,
    move,
    undo,
    reset,
    goToLevel,
    nextLevel,
    canUndo,
  } = useSokoban();

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const swipeRef = useRef<{ x: number; y: number; id: number } | null>(null);

  useEffect(() => {
    wrapperRef.current?.focus({ preventScroll: true });
  }, [levelIdx]);

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
        case 'KeyZ':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            undo();
            return;
          }
          break;
        case 'KeyR':
          if (!e.ctrlKey) {
            e.preventDefault();
            reset();
            return;
          }
          break;
      }
      if (dir) {
        e.preventDefault();
        move(dir);
      }
    },
    [move, undo, reset],
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

  const isFinal = levelIdx === levels.length - 1;
  const totalCleared = progress.cleared.length;

  return (
    <GameShell
      title="推箱子"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={levelIdx}
            onChange={(e) => goToLevel(Number(e.target.value))}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-900"
            aria-label="選擇關卡"
          >
            {levels.map((lv, i) => {
              const done = progress.cleared.includes(i);
              return (
                <option key={i} value={i}>
                  {done ? '✓ ' : ''}關卡 {i + 1}・{lv.name}
                </option>
              );
            })}
          </select>

          <Button variant="secondary" size="sm" onClick={undo} disabled={!canUndo}>
            復原
          </Button>
          <Button variant="secondary" size="sm" onClick={reset}>
            重置
          </Button>

          <div className="ml-auto flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <Field label="MOVES" value={moves} />
            <Field
              label="BEST"
              value={bestMoves[levelIdx] === undefined ? '—' : bestMoves[levelIdx]}
            />
            <Field label="關卡" value={`${levelIdx + 1}/${levels.length}`} />
            <Field label="已通關" value={`${totalCleared}`} />
          </div>
        </div>
      }
      instructions={
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>移動</strong>:鍵盤 <kbd>←</kbd> <kbd>↑</kbd> <kbd>↓</kbd>{' '}
            <kbd>→</kbd> 或 <kbd>WASD</kbd>;手機在棋盤上 <strong>滑動</strong>。
          </li>
          <li>
            把所有 <span className="text-amber-600">📦 箱子</span> 推到{' '}
            <span className="text-emerald-600">🎯 目標點</span>;只能推、不能拉。
          </li>
          <li>
            <strong>復原</strong> <kbd>Ctrl+Z</kbd>;<strong>重置本關</strong> <kbd>R</kbd>。
            <br />
            通關後步數會記錄為該關最佳成績。
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
              🎉
            </span>
            <span className="font-semibold">通關!</span>
            <span className="opacity-80">
              {moves} 步
              {bestMoves[levelIdx] !== undefined && bestMoves[levelIdx] === moves
                ? ' ・ 🏆 最佳成績'
                : ''}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={reset}>
              再走一次
            </Button>
            {!isFinal ? (
              <Button size="sm" onClick={nextLevel}>
                下一關 →
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        ref={wrapperRef}
        tabIndex={0}
        role="application"
        aria-label={`推箱子 — ${levelMeta.name}`}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className={cn(
          'no-focus-ring',
          'mx-auto flex max-w-full select-none touch-none flex-col items-center',
          'rounded-xl bg-zinc-100 p-3 dark:bg-zinc-900',
          'caret-transparent',
        )}
        style={{ caretColor: 'transparent' }}
      >
        <Grid stat={stat} dyn={dyn} />
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

function Grid({ stat, dyn }: { stat: ReturnType<typeof useSokoban>['stat']; dyn: ReturnType<typeof useSokoban>['dyn'] }) {
  // 動態 cell 大小:盡量讓地圖填滿可用空間
  const cellPx = 44;
  const w = stat.cols * cellPx;
  const h = stat.rows * cellPx;
  return (
    <div
      className="relative"
      style={{
        width: `min(100%, ${w}px)`,
        aspectRatio: `${stat.cols} / ${stat.rows}`,
      }}
    >
      <div
        className="absolute inset-0 grid gap-0"
        style={{
          gridTemplateColumns: `repeat(${stat.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${stat.rows}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: stat.rows * stat.cols }).map((_, i) => {
          const r = Math.floor(i / stat.cols);
          const c = i % stat.cols;
          const cell = stat.cells[i];
          const k = KEY(r, c);
          const isBox = dyn.boxes.has(k);
          const isPlayer = dyn.player.r === r && dyn.player.c === c;
          const isGoal = cell === 'goal';
          return (
            <div
              key={i}
              className={cn(
                'flex items-center justify-center',
                cell === 'wall' && 'bg-zinc-700 dark:bg-zinc-600',
                cell === 'floor' && 'bg-amber-100 dark:bg-zinc-800',
                cell === 'goal' && 'bg-emerald-100 dark:bg-emerald-950/40',
                cell === 'void' && 'bg-transparent',
              )}
            >
              {cell === 'wall' ? (
                <span aria-hidden className="text-zinc-500">
                  ▓
                </span>
              ) : null}
              {isGoal && !isBox && !isPlayer ? (
                <span aria-hidden className="text-emerald-500 text-xl">
                  ◎
                </span>
              ) : null}
              {isBox ? (
                <span
                  aria-hidden
                  className={cn(
                    'flex h-[80%] w-[80%] items-center justify-center rounded-md text-xl shadow-md transition-colors',
                    isGoal
                      ? 'bg-emerald-500 text-white'
                      : 'bg-amber-600 text-amber-100',
                  )}
                >
                  📦
                </span>
              ) : null}
              {isPlayer ? (
                <span aria-hidden className="text-2xl">
                  🧑
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
