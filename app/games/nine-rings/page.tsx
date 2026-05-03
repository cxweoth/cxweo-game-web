import type { Metadata } from 'next';
import { NineRings } from '@/components/games/NineRings/NineRings';

export const metadata: Metadata = {
  title: '九連環',
  description: '經典中國益智 Baguenaudier;3/5/7/9 環四種規模,提示與最佳步數記錄。',
};

export default function NineRingsPage() {
  return <NineRings />;
}
