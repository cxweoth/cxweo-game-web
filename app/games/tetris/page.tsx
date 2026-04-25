import type { Metadata } from 'next';
import { Tetris } from '@/components/games/Tetris/Tetris';

export const metadata: Metadata = {
  title: '俄羅斯方塊',
  description: '經典 10×10 俄羅斯方塊；支援旋轉、軟降、硬降、暫停。',
};

export default function TetrisPage() {
  return <Tetris />;
}
