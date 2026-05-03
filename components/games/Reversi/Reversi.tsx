'use client';

import { Button } from '@/components/ui/Button';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { useReversi } from './useReversi';
import { SIZE, type Player } from './types';

const VIEW = 480; // SVG viewBox 邊長
const PAD = 16;
const CELL = (VIEW - PAD * 2) / SIZE;

export function Reversi() {
  const {
    board,
    turn,
    status,
    winner,
    prefs,
    stats,
    counts,
    legalSet,
    lastFlips,
    isAiThinking,
    clickCell,
    restart,
    setPrefs,
  } = useReversi();

  const isOver = status === 'gameOver';
  const totalGames = stats.wins + stats.losses + stats.draws;

  return (
    <GameShell
      title="黑白棋"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
            <ModeButton
              active={prefs.mode === 'pvp'}
              onClick={() => setPrefs({ mode: 'pvp' })}
            >
              雙人
            </ModeButton>
            <ModeButton
              active={prefs.mode === 'ai'}
              onClick={() => setPrefs({ mode: 'ai' })}
            >
              對 AI
            </ModeButton>
          </div>

          {prefs.mode === 'ai' ? (
            <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
              <ModeButton
                active={prefs.playerSide === 1}
                onClick={() => setPrefs({ playerSide: 1 })}
              >
                我執黑
              </ModeButton>
              <ModeButton
                active={prefs.playerSide === 2}
                onClick={() => setPrefs({ playerSide: 2 })}
              >
                我執白
              </ModeButton>
            </div>
          ) : null}

          <Button variant="secondary" size="sm" onClick={restart}>
            新局
          </Button>

          <div className="ml-auto flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <Counter color="black" count={counts.black} active={turn === 1 && !isOver} />
            <Counter color="white" count={counts.white} active={turn === 2 && !isOver} />
            {prefs.mode === 'ai' ? (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                W {stats.wins}・L {stats.losses}・D {stats.draws}
                {totalGames > 0 ? ` (${totalGames})` : ''}
              </span>
            ) : null}
          </div>
        </div>
      }
      instructions={
        <ul className="list-disc space-y-1 pl-5">
          <li>
            點擊有<strong>提示點</strong>的格子落子,夾住對方棋子會被翻成自己色。
          </li>
          <li>沒有合法步時自動「過手」(pass);雙方都無步時棋局結束,棋多者勝。</li>
          <li>
            可切換 <strong>雙人對戰</strong> 或 <strong>對 AI</strong>;AI 模式可選擇執黑(先手)或執白。
          </li>
          <li>戰績只在 AI 模式累計,PvP 不算分。</li>
        </ul>
      }
    >
      {isOver ? (
        <div
          role="status"
          aria-live="polite"
          className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg" aria-hidden>
              🏁
            </span>
            <span className="font-semibold">
              {winner === 0
                ? '和局'
                : winner === 1
                  ? '黑方勝'
                  : '白方勝'}
            </span>
            <span className="opacity-80">
              黑 {counts.black} ・ 白 {counts.white}
            </span>
          </div>
          <Button size="sm" onClick={restart}>
            再來一局
          </Button>
        </div>
      ) : (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
          <span className="font-semibold">輪到</span>
          <span
            className={cn(
              'inline-block h-3 w-3 rounded-full ring-1 ring-black/30',
              turn === 1 ? 'bg-zinc-900' : 'bg-zinc-50',
            )}
            aria-hidden
          />
          <span>{turn === 1 ? '黑方' : '白方'}</span>
          {isAiThinking ? (
            <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400">
              (AI 思考中…)
            </span>
          ) : null}
        </div>
      )}

      <div className="mx-auto w-full max-w-[480px]">
        <BoardSvg
          board={board}
          legalSet={legalSet}
          lastFlips={lastFlips}
          turn={turn}
          onClick={clickCell}
        />
      </div>
    </GameShell>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded px-2.5 py-1 text-xs font-medium transition-colors',
        active
          ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'
          : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
      )}
    >
      {children}
    </button>
  );
}

function Counter({
  color,
  count,
  active,
}: {
  color: 'black' | 'white';
  count: number;
  active: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 rounded-full ring-1',
          color === 'black'
            ? 'bg-zinc-900 ring-zinc-700'
            : 'bg-zinc-50 ring-zinc-300',
          active ? 'ring-2 ring-emerald-500' : '',
        )}
        aria-hidden
      />
      <span className="font-mono tabular-nums">{count}</span>
    </span>
  );
}

function BoardSvg({
  board,
  legalSet,
  lastFlips,
  turn,
  onClick,
}: {
  board: number[];
  legalSet: Set<number>;
  lastFlips: number[];
  turn: Player;
  onClick: (i: number) => void;
}) {
  const flipSet = new Set(lastFlips);
  return (
    <div
      className={cn(
        'no-focus-ring rounded-lg shadow-sm select-none caret-transparent',
        'overflow-hidden',
      )}
      style={{ caretColor: 'transparent' }}
    >
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className="block w-full"
        style={{ aspectRatio: '1 / 1' }}
        role="application"
        aria-label="黑白棋"
      >
        {/* 棋盤底色 */}
        <rect x={0} y={0} width={VIEW} height={VIEW} fill="#15803d" />
        <rect
          x={4}
          y={4}
          width={VIEW - 8}
          height={VIEW - 8}
          fill="#16a34a"
          stroke="#14532d"
          strokeWidth={2}
        />

        {/* 8×8 線 */}
        {Array.from({ length: SIZE + 1 }).map((_, k) => (
          <g key={k}>
            <line
              x1={PAD + k * CELL}
              y1={PAD}
              x2={PAD + k * CELL}
              y2={VIEW - PAD}
              stroke="#0f172a"
              strokeOpacity={0.35}
              strokeWidth={1}
            />
            <line
              x1={PAD}
              y1={PAD + k * CELL}
              x2={VIEW - PAD}
              y2={PAD + k * CELL}
              stroke="#0f172a"
              strokeOpacity={0.35}
              strokeWidth={1}
            />
          </g>
        ))}

        {/* 點位裝飾(2,2 / 2,6 / 6,2 / 6,6) */}
        {[
          [2, 2],
          [2, 6],
          [6, 2],
          [6, 6],
        ].map(([r, c], i) => (
          <circle
            key={i}
            cx={PAD + (c! + 0.5) * CELL}
            cy={PAD + (r! + 0.5) * CELL}
            r={3}
            fill="#0f172a"
            opacity={0.45}
          />
        ))}

        {/* 各格子:點擊區 + 棋子 + 合法步提示 */}
        {board.map((cell, idx) => {
          const r = Math.floor(idx / SIZE);
          const c = idx % SIZE;
          const cx = PAD + (c + 0.5) * CELL;
          const cy = PAD + (r + 0.5) * CELL;
          const isLegal = legalSet.has(idx);
          return (
            <g key={idx}>
              <rect
                x={PAD + c * CELL}
                y={PAD + r * CELL}
                width={CELL}
                height={CELL}
                fill="transparent"
                onClick={() => onClick(idx)}
                style={{ cursor: cell === 0 && isLegal ? 'pointer' : 'default' }}
              />
              {cell !== 0 ? (
                <Stone
                  cx={cx}
                  cy={cy}
                  color={cell === 1 ? 'black' : 'white'}
                  highlight={flipSet.has(idx)}
                />
              ) : isLegal ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r={CELL * 0.18}
                  fill={turn === 1 ? '#0f172a' : '#f8fafc'}
                  opacity={0.4}
                  style={{ pointerEvents: 'none' }}
                />
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Stone({
  cx,
  cy,
  color,
  highlight,
}: {
  cx: number;
  cy: number;
  color: 'black' | 'white';
  highlight: boolean;
}) {
  const r = CELL * 0.4;
  const fill = color === 'black' ? '#111827' : '#fafafa';
  const stroke = color === 'black' ? '#000' : '#cbd5e1';
  return (
    <g style={{ pointerEvents: 'none' }}>
      <ellipse cx={cx} cy={cy + 2} rx={r} ry={r * 0.4} fill="rgba(0,0,0,0.35)" />
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={1.5} />
      {/* 高光,做出立體感 */}
      <ellipse
        cx={cx - r * 0.35}
        cy={cy - r * 0.45}
        rx={r * 0.45}
        ry={r * 0.25}
        fill={color === 'black' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.85)'}
      />
      {highlight ? (
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
}
