'use client';

import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { cn } from '@/lib/utils';
import { GeoDashAudio } from './audio';
import { HAND_LEVEL, LEVEL_END_X } from './level';
import { createWorld, tickPhysics, type World } from './physics';
import { drawScene } from './render';
import { CFG, type Mode, type Status } from './types';

type Props = {
  mode: Mode;
  status: Status;
  audioMuted: boolean;
  bestEndless: number;
  resetKey: number;
  onStart: () => void;
  onDeath: (finalDist: number) => void;
  onWin: () => void;
};

export function GeoDashCanvas({
  mode,
  status,
  audioMuted,
  bestEndless,
  resetKey,
  onStart,
  onDeath,
  onWin,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<World>(createWorld(HAND_LEVEL, LEVEL_END_X));
  const keysRef = useRef<Set<string>>(new Set());
  const pointerDownRef = useRef<boolean>(false);
  const audioRef = useRef<GeoDashAudio | null>(null);

  const propsRef = useRef({
    mode,
    status,
    audioMuted,
    bestEndless,
    onStart,
    onDeath,
    onWin,
  });
  useEffect(() => {
    propsRef.current = { mode, status, audioMuted, bestEndless, onStart, onDeath, onWin };
  });

  // audio mute 隨 props 變化
  useEffect(() => {
    if (!audioRef.current) audioRef.current = new GeoDashAudio();
    audioRef.current.setMuted(audioMuted);
  }, [audioMuted]);

  // 換模式 / 重玩 → 重建 world
  useEffect(() => {
    const isEndless = mode === 'endless';
    const initialObstacles = isEndless ? [] : HAND_LEVEL;
    const initialMaxX = isEndless ? 0 : LEVEL_END_X;
    worldRef.current = createWorld(initialObstacles, initialMaxX);
    keysRef.current.clear();
    pointerDownRef.current = false;
    if (audioRef.current) audioRef.current.stop();
    wrapperRef.current?.focus();
  }, [resetKey, mode]);

  // 主迴圈
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      const p = propsRef.current;
      const jumpHeld =
        keysRef.current.has('Space') ||
        keysRef.current.has('ArrowUp') ||
        keysRef.current.has('KeyW') ||
        keysRef.current.has('KeyJ') ||
        pointerDownRef.current;

      // idle:首次按下 → 開始 + 啟動音樂
      if (p.status === 'idle' && jumpHeld) {
        p.onStart();
        if (audioRef.current) audioRef.current.start();
      }
      // 死/勝:停音樂
      if (p.status === 'dead' || p.status === 'won') {
        if (audioRef.current) audioRef.current.stop();
      }

      const isEndless = p.mode === 'endless';
      tickPhysics(
        worldRef.current,
        dt,
        now,
        p.status === 'playing',
        jumpHeld,
        isEndless,
        () => p.onDeath(worldRef.current.cameraX),
        p.onWin,
      );

      drawScene(ctx, {
        player: worldRef.current.player,
        obstacles: worldRef.current.obstacles,
        particles: worldRef.current.particles,
        cameraX: worldRef.current.cameraX,
        alive: p.status === 'playing' || p.status === 'idle',
        isEndless,
        best: isEndless ? p.bestEndless : null,
        showJumpHint: p.status === 'idle',
      });

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // 自動聚焦,讓鍵盤可用
  useEffect(() => {
    wrapperRef.current?.focus();
  }, [resetKey]);

  // 元件卸載時關 audio
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.stop();
    };
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const blocked =
      e.code === 'Space' ||
      e.code === 'ArrowUp' ||
      e.code === 'ArrowDown' ||
      e.code === 'KeyW' ||
      e.code === 'KeyS' ||
      e.code === 'KeyJ';
    if (blocked) e.preventDefault();
    if (e.repeat) return;
    keysRef.current.add(e.code);
  };

  const handleKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    keysRef.current.delete(e.code);
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerDownRef.current = true;
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    pointerDownRef.current = false;
  };

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      role="application"
      aria-label="節奏方塊"
      className={cn(
        'no-focus-ring',
        'mx-auto block w-full max-w-[800px] touch-manipulation',
        'overflow-hidden rounded-lg shadow-sm',
        'select-none caret-transparent',
      )}
      style={{
        WebkitTapHighlightColor: 'transparent',
        caretColor: 'transparent',
        touchAction: 'none',
      }}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
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
