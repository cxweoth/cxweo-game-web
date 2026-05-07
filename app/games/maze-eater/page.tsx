import type { Metadata } from 'next';
import { MazeEater } from '@/components/games/MazeEater/MazeEater';

export const metadata: Metadata = {
  title: '迷宮吃豆',
  description: '致敬 Pac-Man 的迷宮吃豆遊戲;吃光豆子過關,大力丸讓鬼變藍可吃。',
};

export default function MazeEaterPage() {
  return <MazeEater />;
}
