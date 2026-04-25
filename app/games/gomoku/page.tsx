import type { Metadata } from 'next';
import { Gomoku } from '@/components/games/Gomoku/Gomoku';

export const metadata: Metadata = {
  title: '五子棋',
  description: '15×15 棋盤,先連 5 子者勝。支援雙人對戰與簡易 AI。',
};

export default function GomokuPage() {
  return <Gomoku />;
}
