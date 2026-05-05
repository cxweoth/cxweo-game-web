'use client';

import { cn } from '@/lib/utils';
import { center, edgeColor, hexPathD, hexVertices, makeLayout } from './layout';
import { rowCol, type Cell, type Player } from './types';

type Props = {
  board: Cell[];
  n: number;
  turn: Player;
  legalEnabled: boolean;
  lastMove: number | null;
  winSet: Set<number>;
  onClick: (idx: number) => void;
};

const BLACK_FILL = '#0f172a';
const WHITE_FILL = '#fafafa';
const BLACK_STROKE = '#000';
const WHITE_STROKE = '#cbd5e1';

const EDGE_BLACK = '#0f172a';
const EDGE_WHITE = '#94a3b8'; // 灰色代表白方陣營(白色在木板上看不清)

const BG = '#fef3c7'; // 暖木黃
const HEX_EMPTY = '#fde68a';
const HEX_HOVER = '#fcd34d';
const HEX_STROKE = '#92400e';

const WIN_GLOW = '#34d399';

export function HexBoard({
  board,
  n,
  turn,
  legalEnabled,
  lastMove,
  winSet,
  onClick,
}: Props) {
  const layout = makeLayout(n);

  return (
    <div
      className={cn(
        'no-focus-ring rounded-lg shadow-sm select-none caret-transparent overflow-hidden',
      )}
      style={{ caretColor: 'transparent' }}
    >
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="block w-full"
        style={{ aspectRatio: `${layout.width} / ${layout.height}` }}
        role="application"
        aria-label="六貫棋"
      >
        {/* 背景 */}
        <rect x={0} y={0} width={layout.width} height={layout.height} fill={BG} />

        {/* 每格 hex 底色 + 點擊區 */}
        {board.map((cell, idx) => {
          const { row, col } = rowCol(idx, n);
          const { cx, cy } = center(layout, row, col);
          const verts = hexVertices(cx, cy, layout.R);
          const d = hexPathD(verts);
          const isEmpty = cell === 0;
          const playable = legalEnabled && isEmpty;
          return (
            <g key={`hex-${idx}`}>
              <path
                d={d}
                fill={HEX_EMPTY}
                stroke={HEX_STROKE}
                strokeWidth={1}
                opacity={0.95}
              />
              {playable ? (
                <path
                  d={d}
                  fill={HEX_HOVER}
                  fillOpacity={0}
                  className="hover:fill-amber-300/60 transition-[fill-opacity]"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onClick(idx)}
                />
              ) : (
                <path
                  d={d}
                  fill="transparent"
                  onClick={() => onClick(idx)}
                  style={{ cursor: 'default' }}
                />
              )}
            </g>
          );
        })}

        {/* 染色外框邊(每格逐邊判斷) */}
        {board.map((_, idx) => {
          const { row, col } = rowCol(idx, n);
          const { cx, cy } = center(layout, row, col);
          const verts = hexVertices(cx, cy, layout.R);
          return (
            <g key={`edge-${idx}`}>
              {verts.map((_v, e) => {
                const color = edgeColor(row, col, e, n);
                if (!color) return null;
                const a = verts[e]!;
                const b = verts[(e + 1) % 6]!;
                return (
                  <line
                    key={`e-${idx}-${e}`}
                    x1={a[0]}
                    y1={a[1]}
                    x2={b[0]}
                    y2={b[1]}
                    stroke={color === 'B' ? EDGE_BLACK : EDGE_WHITE}
                    strokeWidth={6}
                    strokeLinecap="round"
                  />
                );
              })}
            </g>
          );
        })}

        {/* 棋子 + 上一手 + 贏線高亮 */}
        {board.map((cell, idx) => {
          if (cell === 0) {
            // 空格:若是當前回合提示,顯示淡色預覽點(只在 legalEnabled 時)
            return null;
          }
          const { row, col } = rowCol(idx, n);
          const { cx, cy } = center(layout, row, col);
          const r = layout.R * 0.7;
          const isLast = idx === lastMove;
          const inWin = winSet.has(idx);
          return (
            <g key={`stone-${idx}`} style={{ pointerEvents: 'none' }}>
              {/* 陰影 */}
              <ellipse
                cx={cx}
                cy={cy + 2}
                rx={r}
                ry={r * 0.4}
                fill="rgba(0,0,0,0.35)"
              />
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={cell === 1 ? BLACK_FILL : WHITE_FILL}
                stroke={cell === 1 ? BLACK_STROKE : WHITE_STROKE}
                strokeWidth={1.5}
              />
              <ellipse
                cx={cx - r * 0.35}
                cy={cy - r * 0.45}
                rx={r * 0.45}
                ry={r * 0.25}
                fill={cell === 1 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.85)'}
              />
              {inWin ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r + 3}
                  fill="none"
                  stroke={WIN_GLOW}
                  strokeWidth={3}
                  opacity={0.95}
                />
              ) : isLast ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r + 2}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  opacity={0.9}
                />
              ) : null}
            </g>
          );
        })}

      </svg>
    </div>
  );
}
