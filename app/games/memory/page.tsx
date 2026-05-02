import type { Metadata } from 'next';
import { Memory } from '@/components/games/Memory/Memory';

export const metadata: Metadata = {
  title: '記憶翻牌',
  description: '翻開兩張卡,圖案相同就配對成功。三難度,挑戰最短破關時間。',
};

export default function MemoryPage() {
  return <Memory />;
}
