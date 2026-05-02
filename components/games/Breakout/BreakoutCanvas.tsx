'use client';

import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { cn, clamp } from '@/lib/utils';
import { CFG } from './types';
import { drawScene } from './render';
import { createWorld, resetBall, tickWorld, type World } from './physics';

type Props = {
  status: 'idle' | 'playing' | 'gameOver';
  level: number;
  onBrickHit: (points: number) => void;
  onLifeLost: () => void;
  onLevelClear: () => void;
  /** 重玩 / 升級時 +1,觸發 world 重建 */
  resetKey: number;
};

export function BreakoutCanvas({
  status,
  level,
  onBrickHit,
  onLifeLost,
  onLevelClear,
  resetKey,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<World>(createWorld(1));
  const keysRef = useRef<Set<string>>(new Set());
  /** 滑鼠 / 觸控位置(畫布內 X);null 表示交給鍵盤 */
  const pointerXRef = useRef<number | null>(null);
  /** 此回合是否已通知過 onLevelClear,避免每幀重複觸發 */
  const clearedNotifiedRef = useRef<boolean>(false);

  const propsRef = useRef({ status, level, onBrickHit, onLifeLost, onLevelClear });
  useEffect(() => {
    propsRef.current = { status, level, onBrickHit, onLifeLost, onLevelClear };
  });

  // 重玩 / 升級 → 重建 world,使用最新 level
  useEffect(() => {
    worldRef.current = createWorld(propsRef.current.level);
    keysRef.current.clear();
    pointerXRef.current = null;
    clearedNotifiedRef.current = false;
    wrapperRef.current?.focus({ preventScroll: true });
  }, [resetKey]);

  // rAF 主迴圈
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let lastNow = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastNow) / 1000);
      lastNow = now;

      const w = worldRef.current;
      const p = propsRef.current;

      if (p.status === 'playing') {
        const r = tickWorld(w, dt, now, keysRef.current, pointerXRef.current);
        if (r.brickScore > 0) p.onBrickHit(r.brickScore);
        if (r.lifeLost) {
          resetBall(w);
          p.onLifeLost();
        }
        if (w.bricksAlive === 0 && !clearedNotifiedRef.current) {
          clearedNotifiedRef.current = true;
          p.onLevelClear();
        }
      }

      drawScene(ctx, w, now);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // --- 輸入 ---

  const setPointerFromClient = (clientX: number) => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    pointerXRef.current = clamp(
      ((clientX - rect.left) / rect.width) * CFG.width,
      0,
      CFG.width,
    );
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // 忽略
    }
    setPointerFromClient(e.clientX);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    setPointerFromClient(e.clientX);
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // 忽略
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (propsRef.current.status !== 'playing') return;
    const blocked =
      e.code === 'ArrowLeft' ||
      e.code === 'ArrowRight' ||
      e.code === 'KeyA' ||
      e.code === 'KeyD';
    if (blocked) {
      e.preventDefault();
      pointerXRef.current = null;
    }
    if (e.repeat) return;
    keysRef.current.add(e.code);
  };

  const handleKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    keysRef.current.delete(e.code);
  };

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      role="application"
      aria-label="打磚塊"
      className={cn(
        'no-focus-ring',
        'mx-auto block w-full max-w-[640px] touch-none',
        'overflow-hidden rounded-lg shadow-sm',
        'select-none caret-transparent',
      )}
      style={{
        WebkitTapHighlightColor: 'transparent',
        caretColor: 'transparent',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      <canvas
        ref={canvasRef}
        width={CFG.width}
        height={CFG.height}
        aria-hidden
        className="block w-full"
        style={{ aspectRatio: `${CFG.width} / ${CFG.height}` }}
      />
    </div>
  );
}
