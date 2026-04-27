'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { StairsCanvas } from './StairsCanvas';
import { useStairs } from './useStairs';
import { CFG } from './types';

export function Stairs() {
  const { status, score, hp, best, onScore, onDamage, onHeal, restart } = useStairs();
  const [resetKey, setResetKey] = useState(0);

  // 同步 restart + 重建 World;確保 React 把兩個 state 一起 batch,
  // 下一幀的 rAF 會看到「新 status + 新 World」,不會出現「新 status + 舊死角色」
  // 一進場就再次判輸的狀況(那會讓玩家覺得要點兩次才重來)
  const handleRestart = useCallback(() => {
    restart();
    setResetKey((k) => k + 1);
  }, [restart]);

  const isOver = status === 'gameOver';
  const isBest = isOver && best === score && score > 0;

  return (
    <GameShell
      title="小朋友下樓梯"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleRestart}>
            重玩
          </Button>
          <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border-2 border-zinc-300 bg-white px-4 py-2 text-base font-medium dark:border-zinc-700 dark:bg-zinc-900">
            <span>
              階梯第 <strong className="font-mono text-lg tabular-nums">{score}</strong> 階
            </span>
            <span className="text-zinc-400">·</span>
            <span>
              生命值 <strong className="font-mono text-lg tabular-nums">{hp}</strong>
              <span className="text-zinc-500"> / {CFG.maxHP}</span>
            </span>
            {best !== null ? (
              <>
                <span className="text-zinc-400">·</span>
                <span className="text-zinc-600 dark:text-zinc-400">最高紀錄 {best}</span>
              </>
            ) : null}
          </div>
        </div>
      }
      instructions={
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>手機 / 觸控</strong>:用畫面下方的 <kbd>←</kbd> <kbd>→</kbd> 大按鈕(按住連續移動);也可在遊戲畫面內滑動手指當作目標位置(放開即停)
          </li>
          <li>
            <strong>桌機鍵盤</strong>:<kbd>←</kbd><kbd>→</kbd> 或 <kbd>A</kbd><kbd>D</kbd>;滑鼠拖移到位置也行
          </li>
          <li>
            <strong>6 種階梯</strong>:
            <span className="ml-1 inline-block px-1 rounded bg-cyan-700 text-white">普通</span> +1 HP、
            <span className="ml-1 inline-block px-1 rounded bg-red-600 text-white">尖刺</span> −5 HP、
            <span className="ml-1 inline-block px-1 rounded bg-yellow-500 text-black">彈簧</span> 彈上去、
            <span className="ml-1 inline-block px-1 rounded bg-slate-600 text-white">滾輪</span> 順方向推、
            <span className="ml-1 inline-block px-1 rounded bg-stone-400 text-stone-900">碎裂</span> 0.5s 後消失、
            <span className="ml-1 inline-block px-1 rounded bg-violet-600 text-white">翻轉</span> 0.4s 後翻過去丟下你
          </li>
          <li>
            HP 上限 12;<strong>頂到上方刺天花板</strong>每 40ms 扣 5 HP(別卡在上面);<strong>掉出畫面底</strong>立即結束。
          </li>
          <li>分數 ≈ 存活時間 ÷ 2.8 秒;深度越深樓梯捲動越快(最多 ×2.14 倍速)。<strong>有 8-bit 音效</strong>(第一次點擊 / 按鍵後啟動)。</li>
        </ul>
      }
    >
      <StairsCanvas
        status={status}
        hp={hp}
        score={score}
        best={best}
        onScore={onScore}
        onDamage={onDamage}
        onHeal={onHeal}
        resetKey={resetKey}
      >
        {isOver ? (
          <ResultPanel score={score} best={best} isBest={isBest} onRestart={handleRestart} />
        ) : null}
      </StairsCanvas>
    </GameShell>
  );
}

/** 遊戲結束面板 — 浮在 canvas 中央 */
function ResultPanel({
  score,
  best,
  isBest,
  onRestart,
}: {
  score: number;
  best: number | null;
  isBest: boolean;
  onRestart: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-live="polite"
      className={cn(
        'absolute inset-0 flex items-center justify-center',
        // 半透明遮罩讓背後 canvas 變暗,但仍看得到死亡瞬間
        'bg-black/45',
        // 點擊穿透:遮罩本身不接 click,中央卡片才接(讓玩家不會誤觸 canvas)
        'pointer-events-auto',
      )}
    >
      <div
        className={cn(
          'flex w-[78%] max-w-[320px] flex-col items-center gap-3',
          'rounded-2xl border-4 px-6 py-5 text-center shadow-2xl',
          'border-amber-400 bg-amber-50 text-amber-900',
          'dark:border-amber-500/70 dark:bg-zinc-900 dark:text-amber-100',
        )}
      >
        <span className="text-3xl" aria-hidden>
          🪜
        </span>
        <h2 className="text-xl font-bold leading-none">遊戲結束</h2>
        <div className="flex flex-col gap-1 text-base">
          <div>
            階梯第 <strong className="font-mono text-lg tabular-nums">{score}</strong> 階
          </div>
          {isBest ? (
            <div className="rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-semibold text-white">
              🏆 刷新紀錄!
            </div>
          ) : best !== null ? (
            <div className="opacity-80">
              最高紀錄 <span className="font-mono tabular-nums">{best}</span>
            </div>
          ) : null}
        </div>
        <Button size="lg" onClick={onRestart} className="mt-1 w-full">
          再來一次
        </Button>
      </div>
    </div>
  );
}
