'use client';

import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { useSpinOut } from './useSpinOut';
import { DIAL_COUNTS, type DialCount, type Goal } from './types';

const GOAL_LABEL: Record<Goal, string> = {
  release: '釋放',
  lock: '鎖回',
};

export function SpinOut() {
  const {
    count,
    goal,
    state,
    moves,
    cleared,
    invalid,
    showHint,
    hintDial,
    best,
    remainingSteps,
    optimal,
    releaseProgress,
    tryClick,
    undo,
    reset,
    changeCount,
    changeGoal,
    setShowHint,
    canRotate,
    canUndo,
  } = useSpinOut();

  return (
    <GameShell
      title="邏輯神尺"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
            {DIAL_COUNTS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => changeCount(c as DialCount)}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                  count === c
                    ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
                )}
              >
                {c} 鈕
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
            {(['release', 'lock'] as Goal[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => changeGoal(g)}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                  goal === g
                    ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
                )}
                title={g === 'release' ? '從全 V 解到全 H,釋放滑桿' : '從全 H 把滑桿鎖回'}
              >
                {GOAL_LABEL[g]}
              </button>
            ))}
          </div>

          <Button variant="secondary" size="sm" onClick={reset}>
            重置
          </Button>
          <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo}>
            復原
          </Button>
          <Button
            variant={showHint ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setShowHint(!showHint)}
          >
            {showHint ? '提示開' : '提示關'}
          </Button>

          <div className="ml-auto flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <Field label="MOVES" value={moves} />
            <Field label="REMAIN" value={remainingSteps} />
            <Field label="OPT" value={optimal} />
            <Field label="BEST" value={best === null ? '—' : best} />
          </div>
        </div>
      }
      instructions={
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>邏輯神尺(Spin-Out)</strong>:由 Binary Arts 設計的經典塑膠益智;
            數學上與九連環同構(都對應 Gray code),但操作體驗截然不同。
          </li>
          <li>
            <strong>規則</strong>:旋鈕 1(最右)永遠可旋轉;旋鈕 k(k ≥ 2)只有在
            <strong>「旋鈕 k−1 為 V 且旋鈕 1..k−2 全 H」</strong>時才能轉動。
          </li>
          <li>
            <strong>釋放</strong>(預設):從全 vertical(滑桿被鎖住)轉到全 horizontal,
            滑桿才能滑出去。<strong>鎖回</strong>:反向把滑桿鎖回。
          </li>
          <li>
            7 鈕標準版需要 <strong>85 步</strong>(85 = ⌊2⁸/3⌋);3 鈕只需 5 步、5 鈕 21 步。
          </li>
          <li>提示開時下一步該轉的旋鈕頂端冒出 ✨;不合法的旋鈕點下去會閃紅。</li>
        </ul>
      }
    >
      {cleared ? (
        <div
          role="status"
          aria-live="polite"
          className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg" aria-hidden>
              🔓
            </span>
            <span className="font-semibold">
              {goal === 'release' ? '滑桿已釋放!' : '滑桿已鎖回!'}
            </span>
            <span className="opacity-80">
              {moves} 步 ・ 最佳走法 {optimal} 步
              {best === moves ? ' ・ 🏆 個人最佳' : ''}
            </span>
          </div>
          <Button size="sm" onClick={reset}>
            再來一次
          </Button>
        </div>
      ) : null}

      <Board
        count={count}
        state={state}
        canRotate={canRotate}
        invalid={invalid}
        hintDial={hintDial}
        releaseProgress={releaseProgress}
        cleared={cleared}
        onClick={tryClick}
      />
    </GameShell>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span className="font-mono text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}

/**
 * 主棋盤:黑塑膠框 + 框內滑出的木刻度尺(滑桿,旋鈕嵌在尺上) + 紅球把手。
 *
 * 「每顆旋鈕有自己的旋轉位置」設計(本版):
 *   • 框體上有 N 個凹槽,每一個都是旋鈕的「天然旋轉位置」
 *   • 旋鈕 K 的天然位置 = 框體 well(從右算起第 K 個 = 最右起算 K-1 格)
 *     - 旋鈕 1 ↔ 最右凹槽(T=0)
 *     - 旋鈕 K ↔ 從右往左第 K 個凹槽(T=(K-1)·unit)
 *   • 拖滑桿 → 旋鈕陣列整體往右滑;某顆旋鈕「飛出框外」(過了最右凹槽)→ 該顆失去支撐,
 *     不能轉(灰色,即使 puzzle 規則允許)
 *
 * 滑桿可被卡住(用戶要求):
 *   • maxX = SLIDER_EXIT_PX × releaseProgress = consecutive_H × unit
 *   • V 旋鈕物理擋住滑桿:當前狀態下「從右數連續幾個 H」決定能拉多遠
 *   • 因此玩家不能無限制把整尺拉出,得照 puzzle 規則一格一格解鎖
 *
 * 框結構依 count 變(用戶要求):
 *   • 滑桿木面寬度 = count × DIAL_SPACING(N=3 短、N=7 長)
 *   • 框體 N 個凹槽,ROTATE 槽固定在 slot N-2(= 旋鈕 2 初始位置)
 *   • 旋鈕 1 起始在 slot N-1(最右)— V 時擋住滑桿不能再往右
 *
 * 拖曳細節:
 *   • isDragging=true → 旋鈕鎖住不能轉
 *   • 放開後 snap 到最近 unit 位置
 *   • cleared(release 達標)時 displayX 再 +80 飛出框外
 */
const DIAL_SIZE = 56;
const DIAL_SPACING = 72;
const SLIDER_HEIGHT = 84;
const HANDLE_SIZE = 40;
// 框體大小依 count 變化(用戶要求):3 鈕窄、7 鈕寬。
// ROTATE 槽固定在「最右邊往左數第二格」(= 旋鈕 2 的初始位置)。

function Board({
  count,
  state,
  canRotate,
  invalid,
  hintDial,
  releaseProgress,
  cleared,
  onClick,
}: {
  count: number;
  state: boolean[];
  canRotate: (dial: number) => boolean;
  invalid: { dial: number; at: number } | null;
  hintDial: number | null;
  releaseProgress: number;
  cleared: boolean;
  onClick: (dial: number) => void;
}) {
  const dials = Array.from({ length: count }, (_, i) => count - i);
  // dials[idx=0] = 旋鈕 N(最左,最遠離把手);dials[idx=N-1] = 旋鈕 1(最右,把手側)

  // 玩家拖曳意圖:state 改變導致 maxX 變化時自動夾住,無需重設
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ start: number; base: number; id: number } | null>(null);

  // 幾何:unit = 凹槽中心距 = snap 步距
  const unit = DIAL_SPACING;
  const woodWidth = count * unit; // 黃尺寬度
  const dialSlotOffset = (DIAL_SPACING - DIAL_SIZE) / 2;
  const dialTop = (SLIDER_HEIGHT - DIAL_SIZE) / 2;
  // 旋鈕 K 在 slider 上的格子 = N - K:旋鈕 1 在最右(slot N-1)、旋鈕 N 在最左(slot 0)
  const dialSliderSlot = (K: number) => count - K;
  // ROTATE 槽固定在 slot N-1(= 旋鈕 1 的初始位置)
  const slotFrameSlot = count - 1;
  // 滑桿位移範圍:T ∈ [0, consecutive_H + 1](單位:格)
  //   T=0:初始 → 旋鈕 1 在 ROTATE 槽
  //   T=1:滑桿右推 1 格 → 旋鈕 1 進入「右側多出來那格」、旋鈕 2 在 ROTATE 槽
  //   T=K-1:旋鈕 K 在 ROTATE 槽
  //   即使全 V,rightward free play = 1 格(對應原規則「旋鈕 1 永遠可轉/可挪走」)
  const consecutiveH = Math.round(releaseProgress * count);
  const minX = 0;
  const maxX = (consecutiveH + 1) * unit;
  // 全 H(release 達標)→ 滑桿飛出框外慶祝;全 V(lock 達標)→ 留在 0
  const flyOut = cleared && consecutiveH >= count;
  const displayX = flyOut
    ? maxX + 80
    : Math.max(minX, Math.min(dragX, maxX));

  const startDrag = (e: ReactPointerEvent<HTMLElement>) => {
    if (cleared) return;
    e.preventDefault();
    e.stopPropagation();
    // base 用 displayX(目前視覺位置)— 若 state 改變導致 dragX 與 displayX 偏離,
    // 用 displayX 才不會出現「手指才剛動就跳一段」的詭異感
    dragRef.current = { start: e.clientX, base: displayX, id: e.pointerId };
    setIsDragging(true);
    setDragX(displayX);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // 已被 capture 時某些瀏覽器丟錯,吞
    }
  };
  const moveDrag = (e: ReactPointerEvent<HTMLElement>) => {
    const ref = dragRef.current;
    if (!ref || ref.id !== e.pointerId) return;
    const proposed = ref.base + (e.clientX - ref.start);
    setDragX(Math.max(minX, Math.min(maxX, proposed)));
  };
  const endDrag = (e: ReactPointerEvent<HTMLElement>) => {
    if (dragRef.current?.id !== e.pointerId) return;
    dragRef.current = null;
    setIsDragging(false);
    // Snap 到最近 unit 位置(夾在 [minX, maxX] 範圍內,容許 T=-1 等負值)
    setDragX((prev) => {
      if (unit <= 0) return prev;
      const snapped = Math.round(prev / unit) * unit;
      return Math.max(minX, Math.min(maxX, snapped));
    });
  };

  const canDrag = !cleared;
  const handleCursor = !canDrag ? 'default' : isDragging ? 'grabbing' : 'grab';

  // 旋鈕 K 對齊到金色槽 ⇔ T = K - 1(格)
  //   旋鈕 K slider 格 = N - K;平移 T 格後 frame 格 = (N - K) + T = N - 1 (槽) ⇔ T = K - 1
  //   K=1 → T=0(初始)、K=2 → T=+1、K=3 → T=+2
  const isAtSlot = (dial: number) => {
    if (isDragging) return false;
    if (unit <= 0) return false;
    return Math.abs(displayX - (dial - 1) * unit) < 0.5;
  };

  // 旋鈕只在「對齊金色槽」+ puzzle 規則允許 + 非拖曳中才能轉
  const handleDialClick = (dial: number) => {
    if (isDragging) return;
    if (!isAtSlot(dial)) return;
    onClick(dial);
  };

  // 黑框寬度 = 黃尺 + 兩側 padding + 右側「多出來那一格」(讓旋鈕 1 可以右推進去)
  // 拆解:左 padding 44 + 黃尺 woodWidth + 1 格 right free play (unit) + 右 padding 44
  const frameWidth = woodWidth + 88 + unit;
  // Container 右側保留 (N+1)×unit + 80 的空間給黃尺繼續往右抽 + cleared 飛出
  const rightExtensionBuffer = (count + 1) * unit + 80;
  return (
    <div
      className="mx-auto w-full"
      style={{
        maxWidth: frameWidth + rightExtensionBuffer + 30,
        paddingLeft: 30, // 左側不再需要 free play(沒有 T=-1)
        paddingRight: rightExtensionBuffer,
      }}
    >
      <div
        className="relative rounded-l-2xl"
        style={{
          width: frameWidth,
          overflow: 'visible',
          background:
            'linear-gradient(to bottom, #1f2937 0%, #0f172a 50%, #020617 100%)',
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, transparent 1px),
            radial-gradient(circle at 70% 60%, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, #1f2937, #0f172a, #020617)
          `,
          backgroundSize: '8px 8px, 12px 12px, 100% 100%',
          // 只在左/上/下投影,右側不投影(因為那是黃尺出口)
          boxShadow:
            '-10px 6px 20px rgba(0,0,0,0.45), 0 -2px 6px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.4)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/20"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-black/60"
        />

        {/* 內框:slot recess + 滑桿 + 旋鈕 */}
        <div className="relative" style={{ padding: '36px 18px', minHeight: 140 }}>
          {/* 凹槽軌道:左側收圓角,右側延伸到框邊緣(= 黃尺出口),不收圓角 */}
          <div
            aria-hidden
            className="absolute"
            style={{
              left: 22,
              right: 0,
              top: 28,
              bottom: 28,
              borderTopLeftRadius: 16,
              borderBottomLeftRadius: 16,
              background: 'linear-gradient(to bottom, #020617, #0a0f1c, #1e293b)',
              boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.75)',
              zIndex: 1,
            }}
          />

          {/* 框體凹槽:N 個圓形凹陷,最右那個是【金色旋轉槽】(唯一可旋轉的位置)。
              其餘是被動 snap 軌道,只代表滑桿能停下的位置,不參與旋轉。
              滑桿拉 k 格後,左邊原本被滑桿蓋住的凹槽會露出來。 */}
          <div
            aria-hidden
            className="absolute"
            style={{
              left: 44, // = 18(框 padding) + 26(slider margin)
              top: 36, // = 框 padding-top
              width: woodWidth,
              height: SLIDER_HEIGHT,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {Array.from({ length: count }).map((_, i) => {
              const isSlot = i === slotFrameSlot;
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: i * DIAL_SPACING + dialSlotOffset,
                    top: dialTop,
                    width: DIAL_SIZE,
                    height: DIAL_SIZE,
                    borderRadius: '50%',
                    background: isSlot
                      ? 'radial-gradient(circle at 50% 35%, #1c1917 0%, #422006 50%, #78350f 100%)'
                      : 'radial-gradient(circle at 50% 35%, #020617 0%, #0a0f1c 55%, #1e293b 100%)',
                    boxShadow: isSlot
                      ? 'inset 0 4px 8px rgba(0,0,0,0.85), 0 0 0 2px rgba(252,211,77,0.85), 0 0 14px rgba(245,158,11,0.55)'
                      : 'inset 0 4px 8px rgba(0,0,0,0.9), inset 0 -1px 1px rgba(255,255,255,0.05)',
                    border: isSlot
                      ? '1.5px solid rgba(252,211,77,0.95)'
                      : '1px solid rgba(0,0,0,0.7)',
                  }}
                />
              );
            })}
          </div>

          {/* 金色旋轉槽上方的箭頭:固定指著 slot N-2(旋鈕 2 的初始位置) */}
          <div
            aria-hidden
            className="absolute flex flex-col items-center"
            style={{
              left:
                44 +
                slotFrameSlot * DIAL_SPACING +
                dialSlotOffset +
                DIAL_SIZE / 2 -
                18,
              top: 4,
              width: 36,
              zIndex: 4,
              pointerEvents: 'none',
            }}
          >
            <span
              className="text-[10px] font-bold tracking-wider"
              style={{ color: '#fcd34d', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
            >
              ROTATE
            </span>
            <span style={{ color: '#fbbf24', fontSize: 14, lineHeight: 1, marginTop: -2 }}>
              ▼
            </span>
          </div>

          {/* 滑桿(尺 + 嵌入旋鈕 + 把手):木面寬度固定 = woodWidth,旋鈕用同 stride 絕對定位 */}
          <div
            className="relative"
            style={{
              marginLeft: 26,
              width: woodWidth,
              transform: `translateX(${displayX}px)`,
              transition: isDragging
                ? 'none'
                : 'transform 380ms cubic-bezier(0.2, 0.8, 0.2, 1)',
              zIndex: 2,
            }}
          >
            <div
              className="relative rounded-md"
              style={{
                width: woodWidth,
                height: SLIDER_HEIGHT,
                background:
                  'linear-gradient(to bottom, #fef9c3 0%, #fde68a 35%, #fcd34d 70%, #d97706 100%)',
                border: '1px solid rgba(120,53,15,0.45)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(120,53,15,0.5), 0 4px 6px rgba(0,0,0,0.5)',
              }}
            >
              {/* 木紋細條 */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 6,
                  pointerEvents: 'none',
                  background: `repeating-linear-gradient(
                    to right,
                    transparent 0,
                    transparent 60px,
                    rgba(120, 53, 15, 0.07) 60px,
                    rgba(120, 53, 15, 0.07) 61px
                  )`,
                }}
              />
              {/* 上緣主刻度(細短) */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 14,
                  right: 14,
                  height: 6,
                  pointerEvents: 'none',
                  background: `repeating-linear-gradient(
                    to right,
                    transparent 0,
                    transparent 11px,
                    rgba(28, 25, 23, 0.55) 11px,
                    rgba(28, 25, 23, 0.55) 12px
                  )`,
                }}
              />

              {/* 旋鈕嵌在尺面上,K 在 slider slot (N - K):dial 1 在最右、dial N 在最左 */}
              {dials.map((dial) => {
                const vertical = state[dial - 1] ?? false;
                const atSlot = isAtSlot(dial);
                const can = canRotate(dial) && !isDragging && atSlot;
                const isInvalid = invalid?.dial === dial;
                const isHint = hintDial === dial && !isDragging && atSlot;
                return (
                  <div
                    key={dial}
                    style={{
                      position: 'absolute',
                      left: dialSliderSlot(dial) * DIAL_SPACING + dialSlotOffset,
                      top: dialTop,
                      width: DIAL_SIZE,
                      height: DIAL_SIZE,
                    }}
                  >
                    <Dial
                      dial={dial}
                      vertical={vertical}
                      canRotate={can}
                      invalid={isInvalid}
                      hint={isHint}
                      onClick={() => handleDialClick(dial)}
                    />
                  </div>
                );
              })}

              {/* 紅塑膠球把手:嵌在尺右端,玩家拖曳這顆把尺拉出來 */}
              <div
                role="slider"
                aria-label="拉動把手把尺抽出"
                aria-valuenow={
                  maxX - minX > 0
                    ? Math.round(((displayX - minX) / (maxX - minX)) * 100)
                    : 0
                }
                aria-valuemin={0}
                aria-valuemax={100}
                tabIndex={0}
                onPointerDown={startDrag}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className="absolute select-none"
                style={{
                  right: -22,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: HANDLE_SIZE,
                  height: HANDLE_SIZE,
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle at 32% 28%, #fecaca 0%, #f87171 25%, #dc2626 55%, #7f1d1d 100%)',
                  boxShadow:
                    '0 4px 8px rgba(0,0,0,0.65), inset 0 -3px 5px rgba(0,0,0,0.35), inset 0 2px 4px rgba(255,255,255,0.5)',
                  cursor: handleCursor,
                  touchAction: 'none',
                  zIndex: 3,
                  // 可拉時微微脈動提示
                  animation: canDrag && dragX < maxX && !isDragging ? 'spinout-pulse 1.6s ease-in-out infinite' : 'none',
                }}
              >
                <span className="sr-only">把手</span>
              </div>

              {/* 把手與尺身接合鉚釘 */}
              <div
                aria-hidden
                className="absolute"
                style={{
                  right: -2,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle at 30% 30%, #d1d5db, #4b5563 70%, #1f2937)',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.5)',
                  zIndex: 2,
                }}
              />
            </div>
          </div>
        </div>

        {/* 框邊螺絲 */}
        {/* 螺絲只放左側兩角(右側是開口,不收邊也不需要釘) */}
        <Screw className="absolute left-2 top-2" />
        <Screw className="absolute left-2 bottom-2" />
      </div>

      {/* 觸控用快捷按鈕:寬度與黃尺一致、左 margin 對齊黃尺左緣,
          每顆按鈕剛好落在上方對應旋鈕正下方 */}
      <div className="mt-3" style={{ width: woodWidth, marginLeft: 44 }}>
        {isDragging ? (
          <div className="mb-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
            拖曳中 — 放開到 snap 位置才能轉旋鈕
          </div>
        ) : null}
        <div className="flex items-center">
          {dials.map((dial) => {
            const atSlot = isAtSlot(dial);
            const can = canRotate(dial) && !isDragging && atSlot;
            const isHint = hintDial === dial && !isDragging && atSlot;
            const v = state[dial - 1] ?? false;
            return (
              <div
                key={dial}
                style={{ width: DIAL_SPACING }}
                className="flex items-center justify-center"
              >
                <button
                  type="button"
                  onClick={() => handleDialClick(dial)}
                  className={cn(
                    'flex h-9 w-12 items-center justify-center gap-1 rounded-md text-xs font-mono font-semibold tabular-nums shadow-sm transition-all',
                    can
                      ? 'bg-white text-zinc-900 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800'
                      : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-900/50 dark:text-zinc-600',
                    isHint ? 'ring-2 ring-amber-400' : '',
                  )}
                  aria-label={`旋鈕 ${dial} ${v ? 'V' : 'H'},${can ? '可轉' : '無法轉'}`}
                >
                  <span>{dial}</span>
                  <span className="opacity-60">{v ? '┃' : '━'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Screw({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('h-2.5 w-2.5 rounded-full', className)}
      style={{
        background: 'radial-gradient(circle at 35% 35%, #6b7280, #1f2937 70%, #000)',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.4)',
      }}
    />
  );
}

/**
 * 旋鈕配色 — dial k(1-based,1 為最右)用 DIAL_COLORS[k−1]。
 * 預先選好 7 色彩虹色階,讓每顆都有獨特身份。
 *
 * base = 高光、main = 主色、dark = 暗面、tab = 拍片色、tabHi = 拍片高光。
 */
const DIAL_COLORS: Array<{
  base: string;
  main: string;
  dark: string;
  tab: string;
  tabHi: string;
}> = [
  { base: '#fecdd3', main: '#fb7185', dark: '#9f1239', tab: '#881337', tabHi: '#fda4af' },
  { base: '#fed7aa', main: '#fb923c', dark: '#9a3412', tab: '#7c2d12', tabHi: '#fdba74' },
  { base: '#fef3c7', main: '#fbbf24', dark: '#92400e', tab: '#78350f', tabHi: '#fcd34d' },
  { base: '#bbf7d0', main: '#4ade80', dark: '#15803d', tab: '#14532d', tabHi: '#86efac' },
  { base: '#a5f3fc', main: '#22d3ee', dark: '#155e75', tab: '#164e63', tabHi: '#67e8f9' },
  { base: '#bfdbfe', main: '#60a5fa', dark: '#1e40af', tab: '#1e3a8a', tabHi: '#93c5fd' },
  { base: '#ddd6fe', main: '#a78bfa', dark: '#5b21b6', tab: '#4c1d95', tabHi: '#c4b5fd' },
];

/**
 * 單一旋鈕:坐落在框體凹槽裡的彩色塑膠旋鈕 + 長方形拍片。
 * 凹槽繪製在 Board 的「框體凹槽」層(absolute on frame body),不在 Dial 內 —
 * 旋鈕跟著 slider 平移,凹槽固定在框上,只有 snap 對齊時兩者才疊在一起。
 *
 * Dial 結構(由內而外):
 *   1. 旋鈕本體:radial-gradient 從色彩高光 → 主色 → 暗面
 *   2. 拍片:長方形塑膠片(8×30px),從拍片高光漸變到深拍片色,inset highlight + drop shadow
 *   3. 中央軸心:小金屬點當鉚釘
 *
 * vertical = 拍片朝上下(初始);horizontal = 朝左右。CSS rotate 300ms 過渡。
 * invalid 時整顆轉紅 + shake;canRotate=false 整體變暗 65% 表示凍結。
 */
function Dial({
  dial,
  vertical,
  canRotate,
  invalid,
  hint,
  onClick,
}: {
  dial: number;
  vertical: boolean;
  canRotate: boolean;
  invalid: boolean;
  hint: boolean;
  onClick: () => void;
}) {
  const angle = vertical ? 0 : 90;
  const color = DIAL_COLORS[(dial - 1) % DIAL_COLORS.length]!;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`旋鈕 ${dial}`}
      className={cn(
        'group relative flex h-14 w-14 items-center justify-center transition-transform',
        canRotate ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-not-allowed',
      )}
    >
      {hint ? (
        <span
          className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 text-base text-amber-600 animate-bounce drop-shadow"
          aria-hidden
        >
          ✨
        </span>
      ) : null}

      {/* 旋鈕本體 + 拍片:坐落在框體凹槽中(凹槽現在畫在 Board 框上,不在 Dial 內) */}
      <div
        className={cn(
          'relative h-11 w-11 rounded-full',
          invalid ? 'animate-shake' : '',
        )}
        style={{
          background: invalid
            ? 'radial-gradient(circle at 30% 25%, #fecaca 0%, #f87171 35%, #dc2626 70%, #7f1d1d 100%)'
            : `radial-gradient(circle at 30% 25%, ${color.base} 0%, ${color.main} 40%, ${color.dark} 80%, #18181b 100%)`,
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -2px 3px rgba(0,0,0,0.45), 0 2px 4px rgba(0,0,0,0.55)',
          opacity: canRotate ? 1 : 0.65,
        }}
      >
        {/* 拍片:長方形,中軸對齊,rotate(angle) 切 V/H */}
        <div
          className="absolute left-1/2 top-1/2 transition-transform duration-300 ease-out"
          style={{
            transform: `translate(-50%, -50%) rotate(${angle}deg)`,
          }}
        >
          <div
            style={{
              width: 8,
              height: 30,
              borderRadius: 3,
              background: invalid
                ? 'linear-gradient(to bottom, #fee2e2, #ef4444 30%, #b91c1c 70%, #450a0a)'
                : `linear-gradient(to bottom, ${color.tabHi}, ${color.tab} 30%, ${color.tab} 70%, #18181b)`,
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.45), 0 1px 2px rgba(0,0,0,0.5)',
            }}
          />
        </div>

        {/* 中央鉚釘 */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(circle at 35% 35%, #d4d4d8, #52525b 70%, #18181b)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.5)',
          }}
        />
      </div>
    </button>
  );
}
