import type { Metadata } from 'next';
import { BubbleShooter } from '@/components/games/BubbleShooter/BubbleShooter';

export const metadata: Metadata = {
  title: '泡泡連消',
  description: '射出同色泡泡 3+ 連消，避免泡泡堆到底線。',
};

export default function BubbleShooterPage() {
  return <BubbleShooter />;
}
