import type { Metadata } from 'next';
import { Game2048 } from '@/components/games/Game2048/Game2048';

export const metadata: Metadata = {
  title: '2048',
  description: '滑動合併相同數字,挑戰 2048!經典數字益智遊戲。',
};

export default function Game2048Page() {
  return <Game2048 />;
}
