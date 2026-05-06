import type { Metadata } from 'next';
import { GeoDash } from '@/components/games/GeoDash/GeoDash';

export const metadata: Metadata = {
  title: '節奏方塊',
  description: '致敬 Geometry Dash Stereo Madness 的節奏跳躍遊戲;手工關卡 + 無盡模式 + 即時合成 EDM 配樂。',
};

export default function GeoDashPage() {
  return <GeoDash />;
}
