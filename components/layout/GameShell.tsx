import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type GameShellProps = {
  title: string;
  /** 玩法/操作說明；可用 ReactNode 方便放列點或鍵位圖 */
  instructions?: ReactNode;
  /** 分數板、開始/暫停按鈕之類的控制列 */
  controls?: ReactNode;
  /** 遊戲主區（Canvas / DOM 格子） */
  children: ReactNode;
  className?: string;
};

/**
 * 每個遊戲頁共用的外框：標題、返回鍵、操作說明、控制列、遊戲區。
 * 新增遊戲時把核心遊戲元件塞進 children 即可。
 */
export function GameShell({ title, instructions, controls, children, className }: GameShellProps) {
  return (
    <div className={cn('mx-auto w-full max-w-5xl px-4 py-6 sm:py-8', className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← 返回首頁
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            {title}
          </h1>
        </div>
      </div>

      {controls ? <div className="mb-4">{controls}</div> : null}

      <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-4">
        {children}
      </div>

      {instructions ? (
        <section
          aria-label="操作說明"
          className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300"
        >
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            操作說明
          </h2>
          {instructions}
        </section>
      ) : null}
    </div>
  );
}
