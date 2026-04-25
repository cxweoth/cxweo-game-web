'use client';

import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { cn } from '@/lib/utils';
import { BOARD_SIZE, STAR_POINTS, type Board, type Move } from './types';

type Props = {
  board: Board;
  lastMove: Move | null;
  winLine: ReadonlyArray<readonly [number, number]> | null;
  cursor: { r: number; c: number };
  disabled: boolean;
  onPlay: (r: number, c: number) => void;
  onMoveCursor: (dr: number, dc: number) => void;
};

const LAST_IDX = BOARD_SIZE - 1;

/** SVG viewBox 多留 1 格空間給座標標籤 */
const PAD = 1;
const VIEW = LAST_IDX + PAD * 2;

function pointerToIntersection(
  rect: DOMRect,
  clientX: number,
  clientY: number,
): { r: number; c: number } | null {
  // 把 pointer 座標換算成 SVG viewBox 座標
  const x = ((clientX - rect.left) / rect.width) * VIEW - PAD;
  const y = ((clientY - rect.top) / rect.height) * VIEW - PAD;
  const c = Math.round(x);
  const r = Math.round(y);
  if (r < 0 || r > LAST_IDX || c < 0 || c > LAST_IDX) return null;
  // 離最近交叉點太遠就忽略（避免誤觸）
  if (Math.hypot(x - c, y - r) > 0.45) return null;
  return { r, c };
}

const COL_LABELS = 'ABCDEFGHJKLMNOP'.slice(0, BOARD_SIZE); // 跳過 I，圍棋慣例

export function GomokuBoard({
  board,
  lastMove,
  winLine,
  cursor,
  disabled,
  onPlay,
  onMoveCursor,
}: Props) {
  // 只有在「使用者實際用鍵盤」時才顯示十字游標。
  // 滑鼠 / 觸控玩家不需要這個視覺干擾。
  const [keyboardMode, setKeyboardMode] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const winSet = useMemo(() => {
    if (!winLine) return null;
    return new Set(winLine.map(([r, c]) => `${r},${c}`));
  }, [winLine]);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    setKeyboardMode(false);
    if (disabled) return;
    const svg = svgRef.current;
    if (!svg) return;
    const pos = pointerToIntersection(svg.getBoundingClientRect(), e.clientX, e.clientY);
    if (!pos) return;
    if (board[pos.r]?.[pos.c] !== null) return;
    onPlay(pos.r, pos.c);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'Enter' ||
      e.key === ' '
    ) {
      setKeyboardMode(true);
    }
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        onMoveCursor(-1, 0);
        return;
      case 'ArrowDown':
        e.preventDefault();
        onMoveCursor(1, 0);
        return;
      case 'ArrowLeft':
        e.preventDefault();
        onMoveCursor(0, -1);
        return;
      case 'ArrowRight':
        e.preventDefault();
        onMoveCursor(0, 1);
        return;
      case ' ':
      case 'Enter':
        e.preventDefault();
        if (board[cursor.r]?.[cursor.c] === null) onPlay(cursor.r, cursor.c);
        return;
    }
  };

  return (
    // tabIndex 放在 wrapper div,讓鍵盤焦點落在 div 而不是 SVG。
    // 部分瀏覽器(尤其 Edge/Chromium) 會在 focusable SVG 上畫一圈白色 focus 框,
    // 即使 outline:none 也擋不住,只有讓 SVG 本身不可 focus 才能徹底避免。
    <div
      tabIndex={0}
      role="grid"
      aria-label={`五子棋 ${BOARD_SIZE}×${BOARD_SIZE} 棋盤`}
      className={cn(
        'no-focus-ring',
        'block w-full max-w-[640px] mx-auto touch-manipulation',
        'rounded-md shadow-sm',
        'bg-amber-100 dark:bg-amber-200',
        // 禁用文字選取與 caret —— div 有 tabIndex 後,瀏覽器會在點擊處放 blinking caret
        'select-none caret-transparent',
      )}
      style={{ WebkitTapHighlightColor: 'transparent', caretColor: 'transparent' }}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      onBlur={() => setKeyboardMode(false)}
    >
    <svg
      ref={svgRef}
      viewBox={`${-PAD} ${-PAD} ${VIEW} ${VIEW}`}
      aria-hidden
      className="block w-full"
    >
      {/* 線條 */}
      <g stroke="#4a3728" strokeWidth={0.03} strokeLinecap="square">
        {Array.from({ length: BOARD_SIZE }, (_, i) => (
          <line key={`h-${i}`} x1={0} y1={i} x2={LAST_IDX} y2={i} />
        ))}
        {Array.from({ length: BOARD_SIZE }, (_, i) => (
          <line key={`v-${i}`} x1={i} y1={0} x2={i} y2={LAST_IDX} />
        ))}
      </g>

      {/* 星位 */}
      <g fill="#4a3728">
        {STAR_POINTS.map(([r, c]) => (
          <circle key={`star-${r}-${c}`} cx={c} cy={r} r={0.1} />
        ))}
      </g>

      {/* 座標標籤：桌機顯示、手機隱藏（透過 CSS 控制） */}
      <g
        className="hidden sm:inline"
        fontSize={0.35}
        fontFamily="var(--font-mono, monospace)"
        fill="#6b4a2f"
        textAnchor="middle"
      >
        {Array.from({ length: BOARD_SIZE }, (_, i) => (
          <text key={`cl-t-${i}`} x={i} y={-0.3}>
            {COL_LABELS[i]}
          </text>
        ))}
        {Array.from({ length: BOARD_SIZE }, (_, i) => (
          <text key={`rl-l-${i}`} x={-0.3} y={i + 0.12} textAnchor="end">
            {i + 1}
          </text>
        ))}
      </g>

      {/* 棋子 */}
      <g>
        {board.map((row, r) =>
          row.map((cell, c) => {
            if (cell === null) return null;
            const isWin = winSet?.has(`${r},${c}`) ?? false;
            return (
              <circle
                key={`stone-${r}-${c}`}
                cx={c}
                cy={r}
                r={0.43}
                fill={cell === 'black' ? '#1c1917' : '#fafaf9'}
                stroke={cell === 'black' ? '#000' : '#78716c'}
                strokeWidth={cell === 'black' ? 0.02 : 0.04}
                className={cn(isWin && 'drop-shadow-[0_0_4px_#ef4444]')}
              />
            );
          }),
        )}
      </g>

      {/* 勝利連線高亮（紅色外圈） */}
      {winLine ? (
        <g fill="none" stroke="#ef4444" strokeWidth={0.06}>
          {winLine.map(([r, c]) => (
            <circle key={`win-${r}-${c}`} cx={c} cy={r} r={0.48} />
          ))}
        </g>
      ) : null}

      {/* 最後一步標記（小紅點，勝利時隱藏，避免與勝利圈混淆） */}
      {lastMove && !winLine ? (
        <circle
          cx={lastMove.c}
          cy={lastMove.r}
          r={0.12}
          fill={lastMove.color === 'black' ? '#ef4444' : '#b91c1c'}
        />
      ) : null}

      {/* 鍵盤游標：只有真的在用鍵盤操作時才顯示，避免干擾滑鼠玩家 */}
      {keyboardMode ? (
        <g
          transform={`translate(${cursor.c}, ${cursor.r})`}
          stroke="#3b82f6"
          strokeWidth={0.04}
          fill="none"
          pointerEvents="none"
          opacity={0.7}
        >
          <circle r={0.46} />
          <line x1={-0.7} y1={0} x2={0.7} y2={0} />
          <line x1={0} y1={-0.7} x2={0} y2={0.7} />
        </g>
      ) : null}
    </svg>
    </div>
  );
}
