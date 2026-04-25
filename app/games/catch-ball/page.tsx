import type { Metadata } from 'next';
import { CatchBall } from '@/components/games/CatchBall/CatchBall';

export const metadata: Metadata = {
  title: '接球',
  description: '左右移動籃子接住掉落的彩球，金球 +5 分；漏 3 顆結束。',
};

export default function CatchBallPage() {
  return <CatchBall />;
}
