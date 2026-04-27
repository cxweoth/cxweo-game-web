import type { Metadata } from 'next';
import { Galaxian } from '@/components/games/Galaxian/Galaxian';

export const metadata: Metadata = {
  title: '小蜜蜂',
  description: '經典 Galaxian 風格射擊遊戲：消滅蜜蜂方陣，閃避俯衝攻擊。',
};

export default function GalaxianPage() {
  return <Galaxian />;
}
