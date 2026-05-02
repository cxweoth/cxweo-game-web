import type { Metadata } from 'next';
import { Breakout } from '@/components/games/Breakout/Breakout';

export const metadata: Metadata = {
  title: '打磚塊',
  description: '經典 Breakout!移動板子接球反彈,清光所有磚塊進下一關。',
};

export default function BreakoutPage() {
  return <Breakout />;
}
