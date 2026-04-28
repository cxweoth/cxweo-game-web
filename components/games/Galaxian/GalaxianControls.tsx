'use client';

// 大顆虛擬控制鍵 — 手機主要操控介面。
// 4 欄 grid:← / → 各佔 1 欄(左手拇指),🔫 射擊佔 2 欄(右手拇指)。
// 三個按鍵都是「按住連續觸發」(setPointerCapture 確保手指滑離也會釋放)。

import type { PointerEvent } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  disabled: boolean;
  onPressDir: (dir: -1 | 1) => void;
  onReleaseDir: (dir: -1 | 1) => void;
  onPressShoot: () => void;
  onReleaseShoot: () => void;
};

export function GalaxianControls({
  disabled,
  onPressDir,
  onReleaseDir,
  onPressShoot,
  onReleaseShoot,
}: Props) {
  const moveCls = cn(
    'flex h-16 select-none items-center justify-center rounded-2xl border-2 text-3xl font-bold shadow-sm transition-colors',
    'border-zinc-300 bg-white text-zinc-700',
    'active:border-amber-400 active:bg-amber-100 active:text-amber-700',
    'dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
    'dark:active:border-amber-500 dark:active:bg-amber-900/40 dark:active:text-amber-100',
    'disabled:cursor-not-allowed disabled:opacity-40',
    'caret-transparent',
  );
  const shootCls = cn(
    'flex h-16 select-none items-center justify-center gap-2 rounded-2xl border-2 text-2xl font-bold shadow-sm transition-colors',
    'border-red-400 bg-red-500 text-white',
    'active:border-red-700 active:bg-red-600',
    'dark:border-red-600 dark:bg-red-600',
    'dark:active:border-red-800 dark:active:bg-red-700',
    'disabled:cursor-not-allowed disabled:opacity-40',
    'caret-transparent',
  );
  const inlineStyle = {
    touchAction: 'none' as const,
    WebkitTapHighlightColor: 'transparent',
  };

  const handleDirDown = (dir: -1 | 1) => (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    onPressDir(dir);
  };
  const handleDirUp = (dir: -1 | 1) => (e: PointerEvent<HTMLButtonElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // 忽略
    }
    onReleaseDir(dir);
  };
  const handleShootDown = (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    onPressShoot();
  };
  const handleShootUp = (e: PointerEvent<HTMLButtonElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // 忽略
    }
    onReleaseShoot();
  };

  return (
    <div className="mx-auto grid w-full max-w-[480px] grid-cols-4 gap-3">
      <button
        type="button"
        aria-label="向左移動"
        disabled={disabled}
        className={moveCls}
        style={inlineStyle}
        onPointerDown={handleDirDown(-1)}
        onPointerUp={handleDirUp(-1)}
        onPointerCancel={() => onReleaseDir(-1)}
        onPointerLeave={() => onReleaseDir(-1)}
        onContextMenu={(e) => e.preventDefault()}
      >
        ←
      </button>
      <button
        type="button"
        aria-label="向右移動"
        disabled={disabled}
        className={moveCls}
        style={inlineStyle}
        onPointerDown={handleDirDown(1)}
        onPointerUp={handleDirUp(1)}
        onPointerCancel={() => onReleaseDir(1)}
        onPointerLeave={() => onReleaseDir(1)}
        onContextMenu={(e) => e.preventDefault()}
      >
        →
      </button>
      <button
        type="button"
        aria-label="射擊(按住連射)"
        disabled={disabled}
        className={`${shootCls} col-span-2`}
        style={inlineStyle}
        onPointerDown={handleShootDown}
        onPointerUp={handleShootUp}
        onPointerCancel={onReleaseShoot}
        onPointerLeave={onReleaseShoot}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span className="text-2xl" aria-hidden>
          🔫
        </span>
        <span>射擊</span>
      </button>
    </div>
  );
}
