import type { Metadata } from 'next';
import { Reversi } from '@/components/games/Reversi/Reversi';

export const metadata: Metadata = {
  title: '黑白棋',
  description: '8×8 經典 Reversi/Othello;夾擊翻棋,結束時棋多者勝。雙人對戰或對 AI。',
};

export default function ReversiPage() {
  return <Reversi />;
}
