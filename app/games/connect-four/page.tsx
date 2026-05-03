import type { Metadata } from 'next';
import { ConnectFour } from '@/components/games/ConnectFour/ConnectFour';

export const metadata: Metadata = {
  title: '連線四子',
  description: '7×6 經典 Connect 4;率先連成 4 子(橫/直/斜)即勝,雙人對戰或對 AI。',
};

export default function ConnectFourPage() {
  return <ConnectFour />;
}
