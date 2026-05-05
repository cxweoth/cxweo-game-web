import type { Metadata } from 'next';
import { Hex } from '@/components/games/Hex/Hex';

export const metadata: Metadata = {
  title: '六貫棋',
  description: '經典 Hex 連通棋;黑方連上下、白方連左右,先連通者勝。N=7/9/11,可選 Pie 規則。',
};

export default function HexPage() {
  return <Hex />;
}
