'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { MineCell } from './MineCell';
import type { Board, DifficultyConfig } from './types';

type Props = {
  board: Board;
  config: DifficultyConfig;
  cursor: { r: number; c: number };
  /** gameOver 時不接受互動 */
  disabled: boolean;
  onReveal: (r: number, c: number) => void;
  onFlag: (r: number, c: number) => void;
  onMoveCursor: (dr: number, dc: number) => void;
};

/** 長按判旗門檻（ms） */
const LONG_PRESS_MS = 450;

/** 依難度決定理想邊長（SSR / 首次 render 用，跨伺服器與客戶端要一致） */
function idealSize(cols: number): number {
  return cols >= 30 ? 24 : cols >= 16 ? 30 : 36;
}

/** 掛載後依實際視窗寬度擬合邊長（只在 client 呼叫） */
function fitSize(cols: number): number {
  const maxWidth = Math.min(window.innerWidth - 48, 920);
  const fit = Math.floor(maxWidth / cols);
  return Math.max(18, Math.min(idealSize(cols), fit));
}

export function MineBoard({ board, config, cursor, disabled, onReveal, onFlag, onMoveCursor }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const pressTimer = useRef<number | null>(null);
  const longPressFired = useRef<boolean>(false);
  // SSR 與客戶端首次 render 都用 idealSize（避免 hydration mismatch）。
  // 掛載後再改成貼合視窗寬度的 fitSize，並監聽 resize。
  const [size, setSize] = useState<number>(() => idealSize(config.cols));

  useEffect(() => {
    const update = () => setSize(fitSize(config.cols));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [config.cols]);

  // 掛上鍵盤操作：focus 狀態下接收方向鍵 / Space / F
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled && e.key !== 'r' && e.key !== 'R') return;
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        onMoveCursor(-1, 0);
        break;
      case 'ArrowDown':
        e.preventDefault();
        onMoveCursor(1, 0);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onMoveCursor(0, -1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        onMoveCursor(0, 1);
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        onReveal(cursor.r, cursor.c);
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        onFlag(cursor.r, cursor.c);
        break;
    }
  };

  // Pointer events：統一處理 mouse + touch + pen
  const findCell = (target: EventTarget | null): { r: number; c: number } | null => {
    if (!(target instanceof HTMLElement)) return null;
    const btn = target.closest<HTMLElement>('button[data-r]');
    if (!btn) return null;
    const r = Number(btn.dataset['r']);
    const c = Number(btn.dataset['c']);
    if (Number.isNaN(r) || Number.isNaN(c)) return null;
    return { r, c };
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const pos = findCell(e.target);
    if (!pos) return;
    longPressFired.current = false;
    // 右鍵：直接插旗（桌機滑鼠）
    if (e.pointerType === 'mouse' && e.button === 2) {
      e.preventDefault();
      onFlag(pos.r, pos.c);
      return;
    }
    // 觸控 / 筆：啟動長按計時
    if (e.pointerType !== 'mouse') {
      pressTimer.current = window.setTimeout(() => {
        longPressFired.current = true;
        onFlag(pos.r, pos.c);
        // 輕微震動回饋（支援 navigator.vibrate 時）
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
      }, LONG_PRESS_MS);
    }
  };

  const clearPressTimer = () => {
    if (pressTimer.current !== null) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    clearPressTimer();
    const pos = findCell(e.target);
    if (!pos) return;
    // 右鍵 up：略過（down 時已處理）
    if (e.pointerType === 'mouse' && e.button === 2) return;
    // 長按已觸發旗標 → 不要再翻開
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    onReveal(pos.r, pos.c);
  };

  const handlePointerCancel = () => {
    clearPressTimer();
    longPressFired.current = false;
  };

  // 滑鼠右鍵：預設會跳出 context menu，擋掉
  const handleContextMenu = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="grid"
      aria-label={`踩地雷 ${config.rows}×${config.cols} 棋盤`}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
      onContextMenu={handleContextMenu}
      className="inline-block select-none outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 rounded overflow-auto max-w-full"
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${config.cols}, ${size}px)` }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => (
            <MineCell
              key={`${r}-${c}`}
              cell={cell}
              focused={cursor.r === r && cursor.c === c}
              disabled={disabled}
              r={r}
              c={c}
              size={size}
            />
          )),
        )}
      </div>
    </div>
  );
}
