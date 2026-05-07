'use client';

import { Button } from '@/components/ui/Button';
import { GameShell } from '@/components/layout/GameShell';
import { cn } from '@/lib/utils';
import { MazeEaterCanvas } from './MazeEaterCanvas';
import { useMazeEater } from './useMazeEater';

export function MazeEater() {
  const {
    status,
    lives,
    level,
    stats,
    runId,
    actorResetKey,
    fullResetKey,
    onScoreUpdate,
    onPacmanCaught,
    onLevelClear,
    restart,
    start,
  } = useMazeEater();

  const isOver = status === 'gameOver';

  return (
    <GameShell
      title="迷宮吃豆"
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={restart}>
            {isOver ? '再玩一次' : '重新開始'}
          </Button>
          <div className="ml-auto rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900">
            最高分 <strong>{stats.highScore}</strong>
          </div>
        </div>
      }
      instructions={
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>方向鍵 / WASD / 觸控滑動</strong> 控制方向。轉彎要在交叉口附近才會生效。
          </li>
          <li>
            吃光所有豆子過關。吃<strong>大力丸</strong>(角落 4 顆閃爍的大顆)後,鬼會變藍且能吃,連吃倍增(200/400/800/1600)。
          </li>
          <li>
            吃完約 30% 豆子後鬼屋下方會出現<strong>水果</strong>(🍒300/🍓500/🍊700/🍎1000/🍉1500,依關卡升級),10 秒內沒吃會消失。
          </li>
          <li>
            每過 1 關:<strong>鬼變快</strong>(每關 +5%,封頂 1.5×)、<strong>大力丸時間縮短</strong>(每關 −0.6s,底限 2.5s),迷宮輪流換 3 張。
          </li>
          <li>被鬼撞到扣 1 命,3 命用完遊戲結束。</li>
        </ul>
      }
    >
      <div className="relative mx-auto w-full max-w-[456px]">
        <MazeEaterCanvas
          status={status}
          highScore={stats.highScore}
          lives={lives}
          level={level}
          runId={runId}
          actorResetKey={actorResetKey}
          fullResetKey={fullResetKey}
          onScoreUpdate={onScoreUpdate}
          onPacmanCaught={onPacmanCaught}
          onLevelClear={onLevelClear}
          onStart={start}
        />

        {(status === 'idle' || status === 'gameOver' || status === 'levelClear') && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                'pointer-events-auto flex flex-col items-center gap-3 rounded-2xl border-2 px-8 py-6 shadow-2xl backdrop-blur-sm',
                status === 'gameOver'
                  ? 'border-rose-300 bg-rose-50/95 text-rose-900'
                  : status === 'levelClear'
                    ? 'border-emerald-300 bg-emerald-50/95 text-emerald-900'
                    : 'border-amber-300 bg-amber-50/95 text-amber-900',
              )}
            >
              <div className="text-4xl" aria-hidden>
                {status === 'gameOver' ? '💀' : status === 'levelClear' ? '🏆' : '🟡'}
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">
                  {status === 'gameOver'
                    ? '遊戲結束'
                    : status === 'levelClear'
                      ? `第 ${level} 關通關!`
                      : '迷宮吃豆'}
                </div>
                {status === 'idle' && (
                  <div className="mt-1 text-sm opacity-80">按方向鍵 / 滑動畫面開始</div>
                )}
                {status === 'gameOver' && (
                  <div className="mt-1 text-sm opacity-80">最高分 {stats.highScore}</div>
                )}
              </div>
              {(status === 'idle' || status === 'gameOver') && (
                <Button size="lg" onClick={status === 'idle' ? start : restart}>
                  {status === 'idle' ? '開始' : '再玩一次'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </GameShell>
  );
}
