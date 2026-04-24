'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { Cell } from './types';

type Props = {
  cell: Cell;
  /** 是否為鍵盤游標所在格 */
  focused: boolean;
  /** 整體遊戲是否已結束（影響 hover/指標樣式與可互動性） */
  disabled: boolean;
  /** 本格座標，外層事件處理用 */
  r: number;
  c: number;
  /** 單格邊長（px），隨難度調整 */
  size: number;
};

// 1–8 各數字用不同顏色（沿用經典踩地雷的色票）
const numberColor: Record<number, string> = {
  1: 'text-blue-600 dark:text-blue-400',
  2: 'text-green-700 dark:text-green-400',
  3: 'text-red-600 dark:text-red-400',
  4: 'text-purple-700 dark:text-purple-400',
  5: 'text-amber-700 dark:text-amber-400',
  6: 'text-teal-700 dark:text-teal-400',
  7: 'text-zinc-900 dark:text-zinc-100',
  8: 'text-zinc-600 dark:text-zinc-400',
};

function renderContent(cell: Cell): { text: string; cls?: string } | null {
  if (cell.isFlagged && !cell.isRevealed) return { text: '🚩' };
  if (!cell.isRevealed) return null;
  if (cell.isMine) return { text: '💣' };
  if (cell.adjacent === 0) return null;
  return {
    text: String(cell.adjacent),
    cls: numberColor[cell.adjacent] ?? '',
  };
}

function MineCellImpl({ cell, focused, disabled, r, c, size }: Props) {
  const content = renderContent(cell);

  // 背景：未翻開較立體、已翻開扁平；踩到的雷深紅
  const bg = cell.isExploded
    ? 'bg-red-500 dark:bg-red-600'
    : cell.isRevealed
      ? 'bg-zinc-100 dark:bg-zinc-800'
      : 'bg-zinc-300 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600';

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={`${r + 1}-${c + 1} ${cell.isFlagged ? '已插旗' : cell.isRevealed ? (cell.isMine ? '地雷' : cell.adjacent === 0 ? '空格' : `數字${cell.adjacent}`) : '未翻開'}`}
      data-r={r}
      data-c={c}
      disabled={disabled && !cell.isRevealed && !cell.isFlagged}
      className={cn(
        'flex items-center justify-center font-mono font-bold select-none',
        'border border-zinc-400/50 dark:border-zinc-600/50',
        'transition-colors touch-manipulation',
        bg,
        cell.isRevealed ? '' : 'active:bg-zinc-400 dark:active:bg-zinc-500',
        focused && 'ring-2 ring-inset ring-blue-500 dark:ring-blue-400 z-10',
        content?.cls,
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.55) }}
    >
      {content?.text}
    </button>
  );
}

export const MineCell = memo(MineCellImpl);
