import type { Metadata } from 'next';
import { Fifteen } from '@/components/games/Fifteen/Fifteen';

export const metadata: Metadata = {
  title: '數字推盤',
  description: '4×4 經典 15 Puzzle;把磚塊推回 1 → 15 順序,挑戰最少步數與最快時間。',
};

export default function FifteenPage() {
  return <Fifteen />;
}
