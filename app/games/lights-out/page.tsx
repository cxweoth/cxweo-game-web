import type { Metadata } from 'next';
import { LightsOut } from '@/components/games/LightsOut/LightsOut';

export const metadata: Metadata = {
  title: '關燈',
  description: '5×5 經典 Lights Out;點擊翻轉自己與 4 鄰,把所有燈關掉。最少步數為勝。',
};

export default function LightsOutPage() {
  return <LightsOut />;
}
