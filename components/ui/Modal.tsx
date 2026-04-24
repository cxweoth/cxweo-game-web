'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ModalProps = {
  open: boolean;
  onClose?: () => void;
  title?: string;
  /** 點擊遮罩是否關閉；結算畫面通常想要 false */
  closeOnBackdrop?: boolean;
  children: ReactNode;
  className?: string;
};

/**
 * 原生 <dialog> 封裝的 Modal。
 * - 支援 ESC 關閉（由 onClose 處理）、焦點鎖在對話框內
 * - 不做遮罩動畫，速度優先
 */
export function Modal({
  open,
  onClose,
  title,
  closeOnBackdrop = true,
  children,
  className,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        // ESC 觸發的 cancel：交給 onClose 處理
        e.preventDefault();
        onClose?.();
      }}
      onClick={(e) => {
        if (!closeOnBackdrop) return;
        // 點到 dialog 本體（遮罩區）時關閉；點到內容不關閉
        if (e.target === ref.current) onClose?.();
      }}
      className={cn(
        'backdrop:bg-black/50',
        'rounded-xl p-0 border-0 w-[min(90vw,28rem)]',
        'bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50',
        'open:flex open:flex-col',
        className,
      )}
    >
      {title ? (
        <header className="border-b border-zinc-200 dark:border-zinc-800 px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </dialog>
  );
}
