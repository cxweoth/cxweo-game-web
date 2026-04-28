'use client';

// 懸浮虛擬方向鍵 — 用 absolute 定位疊在 canvas 內部左下 / 右下角。
// 兩鍵分散到螢幕兩側邊角,左右拇指各管一邊,獨立操作不會打架。
// 配合 GalaxianCanvas 內預設開啟的「自動射擊」,玩家只要顧移動 / 閃避即可。

import type { PointerEvent } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  disabled: boolean;
  onPressDir: (dir: -1 | 1) => void;
  onReleaseDir: (dir: -1 | 1) => void;
};

export function GalaxianControls({ disabled, onPressDir, onReleaseDir }: Props) {
  // 半透明霧面玻璃 + 大字箭頭;active 變琥珀色強烈回饋
  const baseCls = cn(
    'absolute bottom-3 z-10 flex h-20 w-20 select-none items-center justify-center',
    'rounded-full border-2 backdrop-blur-sm shadow-lg transition-all',
    'border-white/40 bg-zinc-900/55 text-white text-4xl font-bold',
    'active:scale-95 active:bg-amber-500/85 active:border-amber-300',
    'disabled:cursor-not-allowed disabled:opacity-30',
    'caret-transparent',
  );
  const inlineStyle = {
    touchAction: 'none' as const,
    WebkitTapHighlightColor: 'transparent',
  };

  const handleDown = (dir: -1 | 1) => (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    onPressDir(dir);
  };
  const handleUp = (dir: -1 | 1) => (e: PointerEvent<HTMLButtonElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // 忽略
    }
    onReleaseDir(dir);
  };

  return (
    <>
      <button
        type="button"
        aria-label="向左移動"
        disabled={disabled}
        className={cn(baseCls, 'left-3')}
        style={inlineStyle}
        onPointerDown={handleDown(-1)}
        onPointerUp={handleUp(-1)}
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
        className={cn(baseCls, 'right-3')}
        style={inlineStyle}
        onPointerDown={handleDown(1)}
        onPointerUp={handleUp(1)}
        onPointerCancel={() => onReleaseDir(1)}
        onPointerLeave={() => onReleaseDir(1)}
        onContextMenu={(e) => e.preventDefault()}
      >
        →
      </button>
    </>
  );
}
