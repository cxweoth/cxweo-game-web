'use client';

import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { cn, clamp } from '@/lib/utils';
import { CFG, type Arrow, type LandedArrow } from './types';
import { drawScene } from './render';

type Props = {
  /** 當前箭的風力（px/s²，正 = 往右） */
  wind: number;
  /** 已落下、保留顯示用的箭 */
  shotsLanded: ReadonlyArray<LandedArrow>;
  /** 結束狀態時禁用輸入 */
  disabled: boolean;
  /** 一支箭落下時呼叫，告知最終位置與分數 */
  onShot: (arrow: LandedArrow) => void;
};

/**
 * 物理 + 輸入 + rAF 都在這個元件。
 *
 * 為了避免每幀都觸發 React re-render,所有「會頻繁變動的」狀態
 *（瞄準角、蓄力時間戳、飛行中的箭）都放在 ref 裡,Canvas 直接畫。
 * 只在「箭落下」這種離散事件呼叫 props.onShot,讓父層更新分數。
 */
export function ArcheryCanvas({ wind, shotsLanded, disabled, onShot }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // 瞄準角度(度)、蓄力起始時間、飛行中的箭 — 全在 ref
  const angleRef = useRef<number>(CFG.defaultAngle);
  const chargeStartRef = useRef<number | null>(null);
  const flyingRef = useRef<Arrow | null>(null);

  // props 也用 ref 鏡射,讓 rAF 閉包讀到最新值
  const propsRef = useRef({ wind, shotsLanded, disabled, onShot });
  useEffect(() => {
    propsRef.current = { wind, shotsLanded, disabled, onShot };
  });

  // disabled 切到 true 時(回合結束),取消任何進行中的蓄力 / 飛行
  useEffect(() => {
    if (disabled) {
      chargeStartRef.current = null;
      flyingRef.current = null;
    }
  }, [disabled]);

  // rAF 主迴圈:每幀更新物理 + 重畫
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      const dt = Math.min(0.033, rawDt); // 防止頁面切回時的大跳
      lastTime = now;

      const flying = flyingRef.current;
      if (flying) {
        const prevX = flying.x;
        const prevY = flying.y;
        flying.vy += CFG.gravity * dt;
        flying.vx += propsRef.current.wind * dt;
        flying.x += flying.vx * dt;
        flying.y += flying.vy * dt;
        flying.angle = Math.atan2(flying.vy, flying.vx);

        // 軌跡尾跡(限制長度)
        const last = flying.trail[flying.trail.length - 1];
        if (!last || (flying.x - last[0]) ** 2 + (flying.y - last[1]) ** 2 > 36) {
          flying.trail.push([flying.x, flying.y]);
          if (flying.trail.length > 80) flying.trail.shift();
        }

        // 碰撞: 1) 越過標靶平面  2) 落地  3) 飛出畫面
        const landed = checkLanding(prevX, prevY, flying);
        if (landed) {
          flyingRef.current = null;
          propsRef.current.onShot(landed);
        }
      }

      // 蓄力比例(供繪圖)
      const cs = chargeStartRef.current;
      const charging = cs !== null;
      const power = charging ? clamp((now - cs) / CFG.chargeMs, 0, 1) : 0;

      drawScene(ctx, {
        angleDeg: angleRef.current,
        charging,
        power,
        flying: flyingRef.current,
        landed: propsRef.current.shotsLanded,
        wind: propsRef.current.wind,
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // --- 輸入控制 ---

  const startCharge = () => {
    if (propsRef.current.disabled) return;
    if (flyingRef.current) return;
    if (chargeStartRef.current !== null) return;
    chargeStartRef.current = performance.now();
  };

  const release = () => {
    const cs = chargeStartRef.current;
    if (cs === null) return;
    chargeStartRef.current = null;
    if (propsRef.current.disabled || flyingRef.current) return;
    const power = clamp((performance.now() - cs) / CFG.chargeMs, 0, 1);
    const speed = CFG.minPower + (CFG.maxPower - CFG.minPower) * power;
    const a = (angleRef.current * Math.PI) / 180;
    flyingRef.current = {
      x: CFG.bowX + 36,
      y: CFG.bowY,
      vx: speed * Math.cos(a),
      vy: -speed * Math.sin(a),
      angle: -a,
      trail: [],
    };
  };

  const setAngleFromClientY = (clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const yInCanvas = ((clientY - rect.top) / rect.height) * CFG.height;
    // 視窗 y(0=頂) → 高仰角；y(底) → 低仰角
    const t = clamp(yInCanvas / CFG.height, 0, 1);
    angleRef.current = CFG.maxAngle - t * (CFG.maxAngle - CFG.minAngle);
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setAngleFromClientY(e.clientY);
    startCharge();
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    setAngleFromClientY(e.clientY);
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // 有些瀏覽器在已 release 後再呼叫會丟錯,忽略
    }
    release();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (propsRef.current.disabled) return;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      angleRef.current = clamp(angleRef.current + CFG.angleStepKey, CFG.minAngle, CFG.maxAngle);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      angleRef.current = clamp(angleRef.current - CFG.angleStepKey, CFG.minAngle, CFG.maxAngle);
    } else if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
      e.preventDefault();
      startCharge();
    }
  };

  const handleKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      release();
    }
  };

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      role="application"
      aria-label="射箭場"
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

// --- 落地判定 ---

/** 環分: 中心 0–10px = 10 分, 90–100px = 1 分, 超出 = 0 */
function ringScore(distFromCenter: number): number {
  if (distFromCenter >= CFG.targetOuterR) return 0;
  return 10 - Math.floor(distFromCenter / CFG.ringW);
}

/**
 * 判斷箭是否在這一幀落下。
 * 1. 越過標靶平面 (x 從 < targetX 變成 >= targetX): 內插出 yAt,計分,停在標靶上
 * 2. 落地 (y >= ground): 脫靶,停在地上
 * 3. 飛出畫面: 脫靶,丟棄
 */
function checkLanding(prevX: number, prevY: number, a: Arrow): LandedArrow | null {
  if (prevX < CFG.targetX && a.x >= CFG.targetX) {
    const t = (CFG.targetX - prevX) / Math.max(0.0001, a.x - prevX);
    const yAt = prevY + t * (a.y - prevY);
    const dist = Math.abs(yAt - CFG.targetY);
    const score = ringScore(dist);
    return { x: CFG.targetX, y: yAt, angle: a.angle, score };
  }
  if (a.y >= CFG.ground) {
    return { x: a.x, y: CFG.ground, angle: a.angle, score: 0 };
  }
  if (a.x < -50 || a.x > CFG.width + 50 || a.y < -200) {
    return { x: a.x, y: a.y, angle: a.angle, score: 0 };
  }
  return null;
}
