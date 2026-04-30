'use client';

import { memo, useRef, type CSSProperties, type PointerEvent } from 'react';
import { cn } from '@/lib/utils';
import { GRID_SIZE, type Direction, type Tile } from './types';

type Props = {
  tiles: ReadonlyArray<Tile>;
  vanishing: ReadonlyArray<Tile>;
  onMove: (dir: Direction) => void;
  /** 結束後仍要顯示棋盤,但不再接受滑動 */
  disabled: boolean;
};

/** 觸控滑動觸發距離(px);過小容易誤觸,過大則手感鈍 */
const SWIPE_THRESHOLD = 24;

/**
 * 各 tile 值對應的配色。
 * 設計考量:小數值用淡色(2/4 偏白),中段橘紅(8–64),
 * 高段黃金(128–512),里程碑用 amber/emerald,2048+ 給紫色高潮。
 */
function tileColor(value: number): string {
  switch (value) {
    case 2:
      return 'bg-stone-100 text-stone-800 dark:bg-stone-200 dark:text-stone-900';
    case 4:
      return 'bg-stone-200 text-stone-800 dark:bg-stone-300 dark:text-stone-900';
    case 8:
      return 'bg-orange-400 text-white';
    case 16:
      return 'bg-orange-500 text-white';
    case 32:
      return 'bg-red-400 text-white';
    case 64:
      return 'bg-red-500 text-white';
    case 128:
      return 'bg-yellow-300 text-yellow-900';
    case 256:
      return 'bg-yellow-400 text-yellow-900';
    case 512:
      return 'bg-yellow-500 text-white';
    case 1024:
      return 'bg-amber-500 text-white';
    case 2048:
      return 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40';
    default:
      return 'bg-purple-600 text-white shadow-lg shadow-purple-600/40';
  }
}

/**
 * 字體大小(以 cqi 容器查詢單位表示),依數字位數縮小。
 * 12cqi ≒ 板寬 12% ≒ cell 寬約 55% — 小數字撐得開、大數字不爆框。
 */
function tileFontCqi(value: number): number {
  const d = String(value).length;
  if (d <= 2) return 12;
  if (d === 3) return 10;
  if (d === 4) return 8;
  return 6;
}

export const Board2048 = memo(function Board2048({
  tiles,
  vanishing,
  onMove,
  disabled,
}: Props) {
  const startRef = useRef<{ x: number; y: number; id: number } | null>(null);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    startRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // 某些瀏覽器在已 capture 時會丟錯,吞掉
    }
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const start = startRef.current;
    if (!start || start.id !== e.pointerId) return;
    startRef.current = null;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (Math.max(ax, ay) < SWIPE_THRESHOLD) return;
    if (ax > ay) onMove(dx > 0 ? 'right' : 'left');
    else onMove(dy > 0 ? 'down' : 'up');
  };
  const onPointerCancel = () => {
    startRef.current = null;
  };

  // 為了讓滑動動畫連續,vanishing tiles 必須跟正規 tiles 在同一個 React children list 中,
  // 用 stable key (tile.id) 才能讓 React 重用 DOM、平滑 transition top/left。
  const allTiles = [...tiles, ...vanishing];

  // 容器 CSS 變數:--gap 控制格距,--cells 控制邊長格數。
  // padding/inset/grid gap 都引用 --gap,改一個值整盤跟著縮放。
  const boardStyle: CSSProperties = {
    '--gap': '2.4%',
    padding: 'var(--gap)',
    containerType: 'inline-size',
  } as CSSProperties;

  return (
    <div
      className="relative aspect-square w-full max-w-[420px] touch-none select-none rounded-xl bg-zinc-300 dark:bg-zinc-700"
      style={boardStyle}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={onPointerCancel}
      role="application"
      aria-label="2048 棋盤"
    >
      {/* 背景格子:純展示用,不接收事件 */}
      <div
        className="pointer-events-none absolute grid"
        style={{
          inset: 'var(--gap)',
          gap: 'var(--gap)',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
        }}
        aria-hidden
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => (
          <div
            key={i}
            className="rounded-md bg-zinc-200/70 dark:bg-zinc-800/80"
          />
        ))}
      </div>

      {/* tiles 絕對定位、依 row/col 算 top/left;CSS transition 讓位置變化平滑 */}
      {allTiles.map((t) => (
        <div
          key={t.id}
          className={cn(
            'absolute flex items-center justify-center rounded-md font-bold tabular-nums',
            tileColor(t.value),
            t.isNew && 'tile-pop',
            t.isMerged && 'tile-merge',
          )}
          style={{
            top: `calc(var(--gap) + ${t.row} * (100% - var(--gap)) / 4)`,
            left: `calc(var(--gap) + ${t.col} * (100% - var(--gap)) / 4)`,
            width: 'calc((100% - 5 * var(--gap)) / 4)',
            height: 'calc((100% - 5 * var(--gap)) / 4)',
            fontSize: `${tileFontCqi(t.value)}cqi`,
            transition: 'top 130ms ease-out, left 130ms ease-out',
          }}
          aria-label={`${t.row + 1} 列 ${t.col + 1} 行,值 ${t.value}`}
        >
          {t.value}
        </div>
      ))}
    </div>
  );
});
