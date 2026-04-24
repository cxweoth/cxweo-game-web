import type { Metadata } from 'next';
import { Minesweeper } from '@/components/games/Minesweeper/Minesweeper';

export const metadata: Metadata = {
  title: '踩地雷',
  description: '翻開所有非地雷的格子；數字提示周圍地雷數。支援初級 / 中級 / 高級。',
};

export default function MinesweeperPage() {
  return <Minesweeper />;
}
