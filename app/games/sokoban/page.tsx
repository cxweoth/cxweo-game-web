import type { Metadata } from 'next';
import { Sokoban } from '@/components/games/Sokoban/Sokoban';

export const metadata: Metadata = {
  title: '推箱子',
  description: '經典 Sokoban;把所有箱子推到目標點才算過關。內建多關卡,可復原。',
};

export default function SokobanPage() {
  return <Sokoban />;
}
