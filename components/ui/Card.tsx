import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type CardProps = HTMLAttributes<HTMLDivElement>;

/** 基礎 Card 容器（首頁遊戲卡、結算面板、排行榜都可用） */
export function Card({ className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-200 bg-white shadow-sm',
        'dark:border-zinc-800 dark:bg-zinc-900',
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({ className, ...rest }: CardProps) {
  return <div className={cn('flex flex-col gap-1 p-5', className)} {...rest} />;
}

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-lg font-semibold text-zinc-900 dark:text-zinc-50', className)}
      {...rest}
    />
  );
}

export function CardDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-zinc-600 dark:text-zinc-400', className)} {...rest} />
  );
}

export function CardContent({ className, ...rest }: CardProps) {
  return <div className={cn('px-5 pb-5', className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: CardProps) {
  return (
    <div className={cn('flex items-center gap-2 px-5 pb-5', className)} {...rest} />
  );
}
