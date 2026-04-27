'use client';

// 大顆虛擬方向鍵 — 手機主要操控介面。
// 按下 = onPress(dir),離開 / 抬起 / 取消 = onRelease(dir)。
// 透過 setPointerCapture,手指滑離按鈕也仍會收到 onPointerUp,
// 避免「按下後手指拖出去角色就一直走」的卡住情形。

import type { PointerEvent } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  disabled: boolean;
  onPress: (dir: -1 | 1) => void;
  onRelease: (dir: -1 | 1) => void;
};

export function DirectionControls({ disabled, onPress, onRelease }: Props) {
  const baseCls = cn(
    'flex h-16 select-none items-center justify-center rounded-2xl border-2 text-3xl font-bold shadow-sm transition-colors',
    'border-zinc-300 bg-white text-zinc-700',
    'active:border-amber-400 active:bg-amber-100 active:text-amber-700',
    'dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
    'dark:active:border-amber-500 dark:active:bg-amber-900/40 dark:active:text-amber-100',
    'disabled:cursor-not-allowed disabled:opacity-40',
    'caret-transparent',
  );

  const handleDown = (dir: -1 | 1) => (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    onPress(dir);
  };
  const handleUp = (dir: -1 | 1) => (e: PointerEvent<HTMLButtonElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // 忽略
    }
    onRelease(dir);
  };

  const renderButton = (dir: -1 | 1, label: string, glyph: string) => (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className={baseCls}
      style={{ touchAction: 'none', WebkitTapHighlightColor: 'transparent' }}
      onPointerDown={handleDown(dir)}
      onPointerUp={handleUp(dir)}
      onPointerCancel={() => onRelease(dir)}
      onPointerLeave={() => onRelease(dir)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {glyph}
    </button>
  );

  return (
    <div className="mx-auto grid w-full max-w-[480px] grid-cols-2 gap-3">
      {renderButton(-1, '向左移動', '←')}
      {renderButton(1, '向右移動', '→')}
    </div>
  );
}
