import type { Metadata } from 'next';
import { Stairs } from '@/components/games/Stairs/Stairs';

export const metadata: Metadata = {
  title: '小朋友下樓梯',
  description: '經典 NS-SHAFT 風格小朋友下樓梯：普通/尖刺/彈簧/滾輪 4 種階梯，避開天花板尖刺。',
};

export default function StairsPage() {
  return <Stairs />;
}
