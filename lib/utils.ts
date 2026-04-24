import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** 合併 Tailwind class，後者覆蓋前者；建議所有 className 都過這個 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** 夾在 [min, max] 之間 */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) return value;
  return Math.min(Math.max(value, min), max);
}

/** [0, n) 的整數序列；用來渲染棋盤格等 */
export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

/** [min, max] 的隨機整數（含端點） */
export function randomInt(min: number, max: number): number {
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}
