import type { Metadata } from 'next';
import { SpinOut } from '@/components/games/SpinOut/SpinOut';

export const metadata: Metadata = {
  title: '邏輯神尺',
  description:
    'Spin-Out:7 顆旋鈕鎖住一支滑桿,只有把所有旋鈕轉成 horizontal 才能釋放。標準 7 鈕需要 85 步。',
};

export default function SpinOutPage() {
  return <SpinOut />;
}
