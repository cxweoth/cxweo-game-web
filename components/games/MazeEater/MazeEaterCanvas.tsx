'use client';

import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { cn } from '@/lib/utils';
import { createWorld, resetActors, resetLevel, tickPhysics, type World } from './physics';
import { drawScene } from './render';
import { CANVAS_H, CANVAS_W, type Direction, type Status } from './types';

type Props = {
  status: Status;
  highScore: number;
  lives: number;
  level: number;
  /** 全新一局 */
  runId: number;
  /** 玩家死亡後重置 actor 位置(保留 maze + score) */
  actorResetKey: number;
  /** 過關後重置整個 maze(保留 score) */
  fullResetKey: number;
  onScoreUpdate: (score: number) => void;
  onPacmanCaught: () => void;
  onLevelClear: () => void;
  onStart: () => void;
};

const SWIPE_THRESHOLD = 24;

export function MazeEaterCanvas(props: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<World>(createWorld());
  const desiredDirRef = useRef<Direction>('left');

  const propsRef = useRef(props);
  useEffect(() => {
    propsRef.current = props;
  });

  useEffect(() => {
    worldRef.current = createWorld();
    desiredDirRef.current = 'left';
    wrapperRef.current?.focus();
  }, [props.runId]);

  useEffect(() => {
    if (props.actorResetKey === 0) return;
    resetActors(worldRef.current);
    desiredDirRef.current = 'left';
  }, [props.actorResetKey]);

  useEffect(() => {
    if (props.fullResetKey === 0) return;
    resetLevel(worldRef.current);
    desiredDirRef.current = 'left';
  }, [props.fullResetKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let rafId = 0;
    let last = performance.now();
    let total = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      total += dt;
      const p = propsRef.current;
      const w = worldRef.current;
      w.pacman.desiredDir = desiredDirRef.current;

      // 死亡動畫:推 mouthPhase 並標 alive=false
      if (p.status === 'dying') {
        w.pacman.alive = false;
        w.pacman.mouthPhase += dt * 2.2;
      } else if (p.status === 'playing') {
        w.pacman.alive = true;
      }

      tickPhysics(
        w,
        dt,
        p.status === 'playing' ? 'playing' : 'idle',
        () => p.onScoreUpdate(w.score),
        () => {
          p.onScoreUpdate(w.score);
          p.onPacmanCaught();
        },
        () => {
          p.onScoreUpdate(w.score);
          p.onLevelClear();
        },
      );

      drawScene(ctx, {
        cells: w.cells,
        pacman: w.pacman,
        ghosts: w.ghosts,
        fruit: w.fruit,
        globalFrightT: w.globalFrightT,
        score: w.score,
        highScore: p.highScore,
        lives: p.lives,
        level: p.level,
        alive: w.pacman.alive,
        time: total,
      });

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const setDir = (d: Direction): void => {
    desiredDirRef.current = d;
    if (propsRef.current.status === 'idle') propsRef.current.onStart();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    let d: Direction | null = null;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') d = 'left';
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') d = 'right';
    else if (e.code === 'ArrowUp' || e.code === 'KeyW') d = 'up';
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') d = 'down';
    if (d) {
      e.preventDefault();
      setDir(d);
    }
  };

  // 觸控滑動
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    swipeRef.current = { x: e.clientX, y: e.clientY };
  };
  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (!swipeRef.current) return;
    const dx = e.clientX - swipeRef.current.x;
    const dy = e.clientY - swipeRef.current.y;
    swipeRef.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;
    if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 'right' : 'left');
    else setDir(dy > 0 ? 'down' : 'up');
  };

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      role="application"
      aria-label="迷宮吃豆"
      className={cn(
        'no-focus-ring',
        'mx-auto block w-full touch-manipulation',
        'overflow-hidden rounded-lg shadow-sm',
        'select-none caret-transparent',
      )}
      style={{
        WebkitTapHighlightColor: 'transparent',
        caretColor: 'transparent',
        touchAction: 'none',
        maxWidth: `${CANVAS_W}px`,
      }}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        aria-hidden
        className="block w-full"
        style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
      />
    </div>
  );
}
