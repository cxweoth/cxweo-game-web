'use client';

import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { cn, clamp } from '@/lib/utils';
import { CFG } from './types';
import { drawScene } from './render';
import { createWorld, tickPhysics, type World } from './physics';

type Props = {
  status: 'playing' | 'gameOver' | 'win';
  score: number;
  best: number | null;
  onScore: (points: number) => void;
  onGameOver: () => void;
  onWin: () => void;
  resetKey: number;
};

export function BubbleShooterCanvas({
  status,
  score,
  best,
  onScore,
  onGameOver,
  onWin,
  resetKey,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<World>(createWorld());
  const keysRef = useRef<Set<string>>(new Set());

  const propsRef = useRef({ status, onScore, onGameOver, onWin });
  useEffect(() => {
    propsRef.current = { status, onScore, onGameOver, onWin };
  });

  useEffect(() => {
    worldRef.current = createWorld();
    keysRef.current.clear();
  }, [resetKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let rafId = 0;
    let lastTime = performance.now();
    let totalTime = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - lastTime) / 1000);
      lastTime = now;
      totalTime += dt;

      const p = propsRef.current;
      // 鍵盤瞄準
      if (p.status === 'playing') {
        if (keysRef.current.has('ArrowLeft') || keysRef.current.has('KeyA')) {
          worldRef.current.aimDeg = clamp(
            worldRef.current.aimDeg - CFG.aimStepKey * 60 * dt,
            -CFG.aimLimitDeg,
            CFG.aimLimitDeg,
          );
        }
        if (keysRef.current.has('ArrowRight') || keysRef.current.has('KeyD')) {
          worldRef.current.aimDeg = clamp(
            worldRef.current.aimDeg + CFG.aimStepKey * 60 * dt,
            -CFG.aimLimitDeg,
            CFG.aimLimitDeg,
          );
        }
      }

      tickPhysics(
        worldRef.current,
        dt,
        p.status === 'playing',
        p.onScore,
        p.onGameOver,
        p.onWin,
      );

      const w = worldRef.current;
      drawScene(ctx, {
        grid: w.grid,
        flying: w.flying,
        currentColor: w.currentColor,
        nextColor: w.nextColor,
        aimDeg: w.aimDeg,
        popFx: w.popFx,
        time: totalTime,
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const setAimFromClient = (clientX: number, clientY: number) => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const xInCanvas = ((clientX - rect.left) / rect.width) * CFG.width;
    const yInCanvas = ((clientY - rect.top) / rect.height) * CFG.height;
    const dx = xInCanvas - CFG.shooterX;
    const dy = yInCanvas - CFG.shooterY;
    // 角度從正上方算（dy 越小越上）
    const ang = (Math.atan2(dx, -dy) * 180) / Math.PI;
    worldRef.current.aimDeg = clamp(ang, -CFG.aimLimitDeg, CFG.aimLimitDeg);
  };

  const fire = () => {
    const w = worldRef.current;
    if (propsRef.current.status !== 'playing') return;
    if (w.flying) return;
    const a = (w.aimDeg * Math.PI) / 180;
    w.flying = {
      x: CFG.shooterX + Math.sin(a) * 30,
      y: CFG.shooterY - Math.cos(a) * 30,
      vx: Math.sin(a) * CFG.shotSpeed,
      vy: -Math.cos(a) * CFG.shotSpeed,
      color: w.currentColor,
    };
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setAimFromClient(e.clientX, e.clientY);
    fire();
  };
  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    setAimFromClient(e.clientX, e.clientY);
  };
  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (propsRef.current.status !== 'playing') return;
    const blocked =
      e.code === 'ArrowLeft' ||
      e.code === 'ArrowRight' ||
      e.code === 'KeyA' ||
      e.code === 'KeyD' ||
      e.code === 'Space' ||
      e.code === 'Enter';
    if (blocked) e.preventDefault();
    if (e.repeat) return;
    keysRef.current.add(e.code);
    if (e.code === 'Space' || e.code === 'Enter') fire();
  };
  const handleKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    keysRef.current.delete(e.code);
  };

  return (
    <div
      tabIndex={0}
      role="application"
      aria-label="泡泡連消"
      className={cn(
        'no-focus-ring',
        'mx-auto block w-full max-w-[480px] touch-manipulation',
        'overflow-hidden rounded-lg shadow-md',
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
