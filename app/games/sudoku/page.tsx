import type { Metadata } from 'next';
import { Sudoku } from '@/components/games/Sudoku/Sudoku';

export const metadata: Metadata = {
  title: '數獨',
  description: '經典 9×9 Sudoku;4 種難度自動生成保證唯一解的題目,支援筆記與計時。',
};

export default function SudokuPage() {
  return <Sudoku />;
}
