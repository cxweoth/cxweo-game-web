'use client';

import { Button } from '@/components/ui/Button';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { useNineRings } from './useNineRings';
import { RING_COUNTS, type Goal, type RingCount } from './types';

const GOAL_LABEL: Record<Goal, string> = {
  'take-off': '拿下',
  'put-back': '放回',
};

export function NineRings() {
  const {
    count,
    goal,
    state,
    moves,
    cleared,
    invalid,
    showHint,
    hintRing,
    best,
    remainingSteps,
    optimal,
    tryClick,
    undo,
    reset,
    changeCount,
    changeGoal,
    setShowHint,
    canToggle,
    canUndo,
  } = useNineRings();

  return (
    <GameShell
      title="九連環"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
            {RING_COUNTS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => changeCount(c as RingCount)}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                  count === c
                    ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
                )}
              >
                {c} 環
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
            {(['take-off', 'put-back'] as Goal[]).map((g) => (
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
                title={g === 'take-off' ? '從全 ON 變成全 OFF' : '從全 OFF 變成全 ON'}
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
            <strong>兩種玩法</strong>:
            <strong>「拿下」</strong>(全 ON → 全 OFF)/{' '}
            <strong>「放回」</strong>(全 OFF → 全 ON);兩者最少步數一樣。
          </li>
          <li>
            <strong>環 1</strong>(最右)永遠可切換;<strong>環 k(k ≥ 2)</strong>
            只能在「環 k−1 為 ON 且環 1..k−2 全為 OFF」時切換 — 這是九連環的核心遞迴。
          </li>
          <li>
            REMAIN 顯示「以最佳走法距離目標還剩幾步」(用 Gray code 算);OPT 是該環數的
            理論最少步數。9 環為 <strong>341</strong> 步。
          </li>
          <li>
            開「提示」會在下一步該動的環畫上 ✨ 標記;不合法的環點下去會閃紅。
          </li>
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
              🎉
            </span>
            <span className="font-semibold">
              {goal === 'take-off' ? '全部拿下了!' : '全部裝回了!'}
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

      <RingsBoard
        state={state}
        canToggle={canToggle}
        invalid={invalid}
        hintRing={hintRing}
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

function RingsBoard({
  state,
  canToggle,
  invalid,
  hintRing,
  onClick,
}: {
  state: boolean[];
  canToggle: (ring: number) => boolean;
  invalid: { ring: number; at: number } | null;
  hintRing: number | null;
  onClick: (ring: number) => void;
}) {
  const n = state.length;
  // 視覺由左到右顯示「環 N、環 N-1、...、環 1」(讓 1 在右邊,符合「右邊最容易」的傳統視覺)
  const rings = Array.from({ length: n }, (_, i) => n - i);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div
        className="relative overflow-hidden rounded-xl p-6 shadow-inner"
        style={{
          // 暖木紋底:斜紋疊在橘黃漸層上
          backgroundImage: `
            repeating-linear-gradient(
              92deg,
              rgba(120, 53, 15, 0.04) 0,
              rgba(120, 53, 15, 0.04) 2px,
              transparent 2px,
              transparent 18px
            ),
            linear-gradient(to bottom, #fef3c7, #fde68a, #fcd34d)
          `,
        }}
      >
        {/* 桿區:橫桿 + 兩端釘頭 + 各環 */}
        <div className="relative mx-auto" style={{ height: 200 }}>
          {/* 鐵桿:5 段漸層做圓柱感 + inset 高光與暗邊 */}
          <div
            aria-hidden
            className="absolute left-2 right-2 top-[60px] h-[14px] rounded-full"
            style={{
              background:
                'linear-gradient(to bottom, #e5e7eb 0%, #9ca3af 18%, #4b5563 50%, #6b7280 80%, #d1d5db 100%)',
              boxShadow:
                '0 3px 5px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(0,0,0,0.45)',
            }}
          />
          {/* 釘頭:左右各一顆球狀,有立體高光 */}
          <div
            aria-hidden
            className="absolute left-0 top-[52px] h-[30px] w-[22px] rounded-full"
            style={{
              background:
                'radial-gradient(circle at 35% 35%, #d1d5db 0%, #6b7280 40%, #1f2937 80%, #0a0a0a 100%)',
              boxShadow: '0 2px 3px rgba(0,0,0,0.55)',
            }}
          />
          <div
            aria-hidden
            className="absolute right-0 top-[52px] h-[30px] w-[22px] rounded-full"
            style={{
              background:
                'radial-gradient(circle at 35% 35%, #d1d5db 0%, #6b7280 40%, #1f2937 80%, #0a0a0a 100%)',
              boxShadow: '0 2px 3px rgba(0,0,0,0.55)',
            }}
          />

          {/* 各環 */}
          <div className="absolute inset-0 flex items-start justify-around px-4">
            {rings.map((ring) => {
              const on = state[ring - 1] ?? false;
              const can = canToggle(ring);
              const isInvalid = invalid?.ring === ring;
              const isHint = hintRing === ring;
              return (
                <Ring
                  key={ring}
                  ring={ring}
                  on={on}
                  canToggle={can}
                  invalid={isInvalid}
                  hint={isHint}
                  onClick={() => onClick(ring)}
                />
              );
            })}
          </div>
        </div>

        {/* 下方數字快捷鍵(觸控用) */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
          {rings.map((ring) => {
            const can = canToggle(ring);
            const isHint = hintRing === ring;
            const on = state[ring - 1] ?? false;
            return (
              <button
                key={ring}
                type="button"
                onClick={() => onClick(ring)}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-md text-sm font-mono font-semibold tabular-nums shadow-sm transition-all',
                  can
                    ? 'bg-white text-zinc-900 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800'
                    : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-900/50 dark:text-zinc-600',
                  isHint ? 'ring-2 ring-amber-400' : '',
                  on ? '' : 'opacity-60',
                )}
                aria-label={`環 ${ring} ${on ? '在桿上' : '已下'},${can ? '可切換' : '無法切換'}`}
              >
                {ring}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * 單一鐵環視覺
 *
 * 質感策略:
 *   1. 外層黑色描邊(opacity 0.6)做出「鐵鑄體積」的輪廓
 *   2. 主環用線性漸層(左上亮 → 右下暗)模擬 3D 圓管表面光線
 *   3. 上半弧加亮色高光線(模擬光源從上來)、下半弧加深色陰影
 *   4. ON / OFF 用兩套顏色:ON 較亮(被把玩中),OFF 較暗沉(冷落感)
 *   5. invalid 時整個環瞬間轉紅 + shake
 *   6. 每環 SVG 的 gradient id 都帶 ring 編號避免衝突
 */
function Ring({
  ring,
  on,
  canToggle,
  invalid,
  hint,
  onClick,
}: {
  ring: number;
  on: boolean;
  canToggle: boolean;
  invalid: boolean;
  hint: boolean;
  onClick: () => void;
}) {
  const yOffset = on ? 0 : 60;
  const gradId = `ring-grad-${ring}-${on ? 'on' : 'off'}`;
  const innerGradId = `ring-inner-${ring}`;

  // 顏色組:ON = 亮鐵、OFF = 暗鐵、invalid = 紅
  const stops = invalid
    ? [
        { off: '0%', c: '#fecaca' },
        { off: '40%', c: '#dc2626' },
        { off: '100%', c: '#7f1d1d' },
      ]
    : on
      ? [
          { off: '0%', c: '#f3f4f6' },
          { off: '20%', c: '#9ca3af' },
          { off: '50%', c: '#4b5563' },
          { off: '80%', c: '#1f2937' },
          { off: '100%', c: '#0f172a' },
        ]
      : [
          { off: '0%', c: '#71717a' },
          { off: '40%', c: '#3f3f46' },
          { off: '100%', c: '#18181b' },
        ];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`環 ${ring}`}
      className={cn(
        'group relative flex flex-col items-center transition-transform',
        canToggle ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-not-allowed',
      )}
      style={{ width: 70, height: 200, paddingTop: 6 }}
    >
      {hint ? (
        <span
          className="absolute left-1/2 z-10 -translate-x-1/2 text-lg text-amber-500 animate-bounce drop-shadow"
          style={{ top: -6 }}
          aria-hidden
        >
          ✨
        </span>
      ) : null}

      {/* 外層 div 負責 translateY(掉下/抬起);內層 svg 負責 shake */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{ transform: `translateY(${yOffset}px)` }}
      >
        <svg
          viewBox="0 0 70 70"
          width={70}
          height={70}
          className={cn(invalid ? 'animate-shake' : '')}
          aria-hidden
        >
          <defs>
            <linearGradient id={gradId} x1="20%" y1="0%" x2="80%" y2="100%">
              {stops.map((s) => (
                <stop key={s.off} offset={s.off} stopColor={s.c} />
              ))}
            </linearGradient>
            {/* 內側陰影:radial 從中心透明 → 邊緣暗,鋪在環孔內側讓「孔」更有深度 */}
            <radialGradient id={innerGradId} cx="50%" cy="50%" r="50%">
              <stop offset="55%" stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
            </radialGradient>
          </defs>

          {/* 落地陰影(僅 OFF 時繪;ON 時陰影被桿擋住沒意義) */}
          {!on ? (
            <ellipse
              cx={35}
              cy={64}
              rx={26}
              ry={3.2}
              fill="rgba(0,0,0,0.32)"
            />
          ) : null}

          {/* 外圈黑邊:作鐵鑄輪廓,讓環在所有背景下都有定義 */}
          <circle
            cx={35}
            cy={35}
            r={25}
            fill="none"
            stroke="#000"
            strokeOpacity={0.5}
            strokeWidth={9}
          />
          {/* 主環:金屬漸層 stroke */}
          <circle
            cx={35}
            cy={35}
            r={25}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={7}
          />
          {/* 內側陰影:讓孔看起來有深度 */}
          <circle cx={35} cy={35} r={21} fill={`url(#${innerGradId})`} />

          {/* 上弧高光:模擬光源從上來反射 */}
          <path
            d="M 16 28 A 25 25 0 0 1 54 28"
            stroke={on ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.22)'}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
          {/* 下弧暗影 */}
          <path
            d="M 16 42 A 25 25 0 0 0 54 42"
            stroke="rgba(0,0,0,0.55)"
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
          />

          {/* 中央小銅牌寫編號 */}
          <circle
            cx={35}
            cy={35}
            r={9}
            fill={on ? '#52525b' : '#27272a'}
            stroke="#000"
            strokeOpacity={0.6}
            strokeWidth={1}
          />
          <circle cx={32} cy={32} r={3} fill="rgba(255,255,255,0.18)" />
          <text
            x={35}
            y={39}
            textAnchor="middle"
            fontSize={11}
            fontWeight={700}
            fill={on ? '#fde68a' : '#a1a1aa'}
            fontFamily="ui-monospace, SFMono-Regular, monospace"
            style={{ userSelect: 'none' }}
          >
            {ring}
          </text>
        </svg>
      </div>
    </button>
  );
}
