'use client';

import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { cn, clamp } from '@/lib/utils';
import { CFG, type Images } from './types';
import { drawScene } from './render';
import { createWorld, tickPhysics, type World } from './game';
import { playSound, unlockAudio } from './sound';
import { DirectionControls } from './DirectionControls';

const ASSET_BASE = '/games/stairs';

function preloadImages(): Images {
  const make = (file: string): HTMLImageElement => {
    const img = new Image();
    img.src = `${ASSET_BASE}/${file}`;
    return img;
  };
  return {
    bg: make('bg.jpg'),
    top: make('top.jpg'),
    block: make('block.jpg'),
    spring: make('jblock2.png'),
    conveyor: make('spic.jpg'),
  };
}

type Props = {
  status: 'playing' | 'gameOver';
  hp: number;
  score: number;
  best: number | null;
  onScore: (delta: number) => void;
  onDamage: (amount: number) => void;
  onHeal: (amount: number) => void;
  resetKey: number;
  /** 結算面板等浮動內容,absolute 在 canvas 上;手機虛擬按鍵會在這外面、不被遮罩蓋住 */
  children?: ReactNode;
};

export function StairsCanvas({
  status,
  hp,
  score,
  best,
  onScore,
  onDamage,
  onHeal,
  resetKey,
  children,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<World>(createWorld());
  const keysRef = useRef<Set<string>>(new Set());
  /** 滑鼠 / 觸控目標 X(畫布內);null = 鍵盤接管 */
  const mouseXRef = useRef<number | null>(null);
  const imagesRef = useRef<Images | null>(null);

  useEffect(() => {
    imagesRef.current = preloadImages();
  }, []);

  // props 鏡射
  const propsRef = useRef({ status, hp, score, best, onScore, onDamage, onHeal });
  useEffect(() => {
    propsRef.current = { status, hp, score, best, onScore, onDamage, onHeal };
  });

  // 重玩 / 掛載 → 重置 World + 搶焦點
  useEffect(() => {
    worldRef.current = createWorld();
    keysRef.current.clear();
    mouseXRef.current = null;
    wrapperRef.current?.focus({ preventScroll: true });
  }, [resetKey]);

  // rAF 主迴圈
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
      const w = worldRef.current;
      // 包一層 onDamage:在 dispatch 給 React 之前先記錄受傷時刻,
      // renderer 會根據 elapsedSec - lastDamageAtSec 算出閃紅 alpha
      const onDamageWithFlash = (amount: number) => {
        w.lastDamageAtSec = w.elapsedSec;
        p.onDamage(amount);
      };
      tickPhysics(
        w,
        dt,
        p.status === 'playing',
        keysRef.current,
        mouseXRef.current,
        onDamageWithFlash,
        p.onScore,
        p.onHeal,
        playSound,
      );

      drawScene(ctx, {
        char: w.char,
        stairs: w.stairs,
        hp: p.hp,
        score: p.score,
        best: p.best,
        walkAnim: w.walkAnim,
        totalTime,
        elapsedSec: w.elapsedSec,
        lastDamageAtSec: w.lastDamageAtSec,
        images: imagesRef.current,
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const setMouseFromClient = (clientX: number) => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    mouseXRef.current = clamp(
      ((clientX - rect.left) / rect.width) * CFG.width,
      CFG.charW / 2,
      CFG.width - CFG.charW / 2,
    );
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setMouseFromClient(e.clientX);
    unlockAudio();
  };
  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    setMouseFromClient(e.clientX);
  };
  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // 忽略
    }
    // 手指離開 → 取消游標目標,角色停下來。
    // 沒清掉的話「最後一次手指位置」會繼續拉著角色走,在手機上特別反直覺。
    mouseXRef.current = null;
  };

  // 虛擬方向鍵(手機主要操控介面)— 直接操作 keysRef,等同按住鍵盤箭頭。
  // 按下時也清掉 mouseXRef,避免「拖一下後再按按鍵」兩種輸入打架。
  const handleDirPress = (dir: -1 | 1) => {
    mouseXRef.current = null;
    keysRef.current.add(dir === -1 ? 'ArrowLeft' : 'ArrowRight');
    unlockAudio();
  };
  const handleDirRelease = (dir: -1 | 1) => {
    keysRef.current.delete(dir === -1 ? 'ArrowLeft' : 'ArrowRight');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (propsRef.current.status !== 'playing') return;
    unlockAudio();
    const blocked =
      e.code === 'ArrowLeft' ||
      e.code === 'ArrowRight' ||
      e.code === 'KeyA' ||
      e.code === 'KeyD';
    if (blocked) {
      e.preventDefault();
      mouseXRef.current = null;
    }
    if (e.repeat) return;
    keysRef.current.add(e.code);
  };
  const handleKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    keysRef.current.delete(e.code);
  };

  return (
    <div className="flex flex-col items-stretch gap-3">
      {/* relative 限制在「畫布」這層,result panel 透過 children 注入,
          它的 absolute inset-0 只會蓋畫布,不會蓋到下方的虛擬按鍵 */}
      <div className="relative mx-auto w-full max-w-[480px]">
        <div
          ref={wrapperRef}
          tabIndex={0}
          role="application"
          aria-label="小朋友下樓梯"
          className={cn(
            'no-focus-ring',
            'block w-full touch-manipulation',
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
        {children}
      </div>
      <DirectionControls
        disabled={status !== 'playing'}
        onPress={handleDirPress}
        onRelease={handleDirRelease}
      />
    </div>
  );
}

