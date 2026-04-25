'use client';

import { useEffect, useRef, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { CFG, type Board, type Piece, type PieceType } from './types';
import { drawBoard, drawNextPreview } from './render';

type Props = {
  board: Board;
  piece: Piece;
  ghost: Piece;
  next: PieceType;
  paused: boolean;
  /** 結束時禁用輸入(由父元件控制) */
  onMove: (dx: number, dy: number) => void;
  onRotate: () => void;
  onDrop: () => void;
  onSoftDrop: (on: boolean) => void;
  onTogglePause: () => void;
};

export function TetrisCanvas({
  board,
  piece,
  ghost,
  next,
  paused,
  onMove,
  onRotate,
  onDrop,
  onSoftDrop,
  onTogglePause,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);

  // 主棋盤每次 props 變動就重畫
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawBoard(ctx, { board, piece, ghost, paused });
  }, [board, piece, ghost, paused]);

  // 下一塊預覽
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawNextPreview(ctx, next, 96);
  }, [next]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.code) {
      case 'ArrowLeft':
        e.preventDefault();
        onMove(-1, 0);
        return;
      case 'ArrowRight':
        e.preventDefault();
        onMove(1, 0);
        return;
      case 'ArrowDown':
        e.preventDefault();
        if (!e.repeat) onSoftDrop(true);
        return;
      case 'ArrowUp':
      case 'KeyX':
        e.preventDefault();
        if (!e.repeat) onRotate();
        return;
      case 'Space':
        e.preventDefault();
        if (!e.repeat) onDrop();
        return;
      case 'KeyP':
      case 'Escape':
        e.preventDefault();
        if (!e.repeat) onTogglePause();
        return;
    }
  };

  const handleKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.code === 'ArrowDown') {
      e.preventDefault();
      onSoftDrop(false);
    }
  };

  return (
    <div
      tabIndex={0}
      role="application"
      aria-label="俄羅斯方塊"
      className={cn(
        'no-focus-ring',
        'mx-auto flex flex-col items-center gap-4 p-2 sm:flex-row sm:items-start sm:justify-center',
        'select-none caret-transparent',
      )}
      style={{ caretColor: 'transparent' }}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      <canvas
        ref={canvasRef}
        width={CFG.width}
        height={CFG.height}
        className="rounded-md shadow-md"
        style={{ width: 'min(280px, 88vw)', aspectRatio: `${CFG.width} / ${CFG.height}` }}
        aria-hidden
      />

      <div className="flex flex-col items-center gap-3 sm:items-start">
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            下一塊
          </div>
          <canvas
            ref={previewRef}
            width={96}
            height={96}
            className="rounded-md shadow-sm"
            aria-hidden
          />
        </div>

        <TouchPad
          onMove={onMove}
          onRotate={onRotate}
          onDrop={onDrop}
          onSoftDrop={onSoftDrop}
        />
      </div>
    </div>
  );
}

/** 觸控/滑鼠按鍵；桌機也可用,跟鍵盤共存 */
function TouchPad({
  onMove,
  onRotate,
  onDrop,
  onSoftDrop,
}: {
  onMove: (dx: number, dy: number) => void;
  onRotate: () => void;
  onDrop: () => void;
  onSoftDrop: (on: boolean) => void;
}) {
  const btn =
    'flex h-12 w-12 items-center justify-center rounded-md border border-zinc-200 bg-white text-lg font-bold shadow-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700';
  const downHandlers = (cb: () => void) => ({
    onClick: cb,
  });
  return (
    <div className="grid grid-cols-3 gap-2">
      <button type="button" className={btn} aria-label="左" {...downHandlers(() => onMove(-1, 0))}>
        ←
      </button>
      <button type="button" className={btn} aria-label="旋轉" {...downHandlers(onRotate)}>
        ↻
      </button>
      <button type="button" className={btn} aria-label="右" {...downHandlers(() => onMove(1, 0))}>
        →
      </button>
      <button
        type="button"
        className={btn}
        aria-label="軟降(按住加速)"
        onPointerDown={(e) => {
          e.preventDefault();
          onSoftDrop(true);
        }}
        onPointerUp={() => onSoftDrop(false)}
        onPointerLeave={() => onSoftDrop(false)}
      >
        ↓
      </button>
      <button
        type="button"
        className={`${btn} col-span-2 w-auto px-3`}
        aria-label="一鍵落下"
        {...downHandlers(onDrop)}
      >
        DROP
      </button>
    </div>
  );
}
