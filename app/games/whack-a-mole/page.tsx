import type { Metadata } from 'next';
import { WhackAMole } from '@/components/games/WhackAMole/WhackAMole';

export const metadata: Metadata = {
  title: '打地鼠',
  description: '30 秒內打越多地鼠越好。打到空地會扣分,反應要快!',
};

export default function WhackAMolePage() {
  return <WhackAMole />;
}
