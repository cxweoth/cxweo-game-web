import type { Metadata } from 'next';
import { Snake } from '@/components/games/Snake/Snake';

export const metadata: Metadata = {
  title: '貪食蛇',
  description: '經典 Snake!吃蘋果加長,撞牆或自己就結束。挑戰最高分。',
};

export default function SnakePage() {
  return <Snake />;
}
