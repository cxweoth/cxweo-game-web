'use client';

import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { cn } from '@/lib/utils';
import { CFG, type Dir } from './types';
import { drawScene } from './render';
import { createWorld, queueDir, tickWorld, type World } from './game';

type Props = {
  status: 'playing' | 'gameOver';
  onEat: () => void;
  onDie: () => void;
  /** 重玩時 +1,讓 Canvas 重建 World */
  resetKey: number;
};

/** 觸控滑動觸發距離(px)。略大於 2048 那邊 24,因為這裡更需要明確方向。 */
const SWIPE_THRESHOLD = 28;

export function SnakeCanvas({ status, onEat, onDie, resetKey }: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<World>(createWorld());
  const propsRef = useRef({ status, onEat, onDie });
  useEffect(() => {
    propsRef.current = { status, onEat, onDie };
  });

  // 觸控滑動起點(用 pointerType 不分桌機 / 觸控,一致處理)
  const swipeRef = useRef<{ x: number; y: number; id: number } | null>(null);

  // 掛載 / 重玩 → 重建世界並把焦點搶回 wrapper,讓鍵盤馬上能用
  useEffect(() => {
    worldRef.current = createWorld();
    wrapperRef.current?.focus({ preventScroll: true });
  }, [resetKey]);

  // rAF 主迴圈:tick 世界 + 老化 popup + 畫圖
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
        const r = tickWorld(w, now);
        if (r.ate) p.onEat();
        if (r.dead) p.onDie();
      }

      // popup 老化(不分狀態,讓死亡瞬間最後一個 +10 仍能飄完)
      for (const popup of w.popups) {
        popup.age += dt;
        popup.y -= 30 * dt;
      }
      w.popups = w.popups.filter((popup) => popup.age < popup.ttl);

      drawScene(ctx, w, now);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // --- 鍵盤 ---

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (propsRef.current.status !== 'playing') return;
    let dir: Dir | null = null;
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        dir = { dx: 0, dy: -1 };
        break;
      case 'ArrowDown':
      case 'KeyS':
        dir = { dx: 0, dy: 1 };
        break;
      case 'ArrowLeft':
      case 'KeyA':
        dir = { dx: -1, dy: 0 };
        break;
      case 'ArrowRight':
      case 'KeyD':
        dir = { dx: 1, dy: 0 };
        break;
    }
    if (dir) {
      e.preventDefault();
      queueDir(worldRef.current, dir);
    }
  };

  // --- 觸控 / 滑鼠拖曳滑動 ---

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    swipeRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // 某些瀏覽器在已 capture 時會丟錯,吞掉
    }
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const s = swipeRef.current;
    swipeRef.current = null;
    if (!s || s.id !== e.pointerId) return;
    if (propsRef.current.status !== 'playing') return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (Math.max(ax, ay) < SWIPE_THRESHOLD) return;
    const dir: Dir =
      ax > ay
        ? { dx: dx > 0 ? 1 : -1, dy: 0 }
        : { dx: 0, dy: dy > 0 ? 1 : -1 };
    queueDir(worldRef.current, dir);
  };

  const handlePointerCancel = () => {
    swipeRef.current = null;
  };

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      role="application"
      aria-label="貪食蛇"
      className={cn(
        'no-focus-ring',
        'mx-auto block w-full max-w-[480px] touch-none',
        'overflow-hidden rounded-lg shadow-sm',
        'select-none caret-transparent',
      )}
      style={{
        WebkitTapHighlightColor: 'transparent',
        caretColor: 'transparent',
        touchAction: 'none',
      }}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
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
