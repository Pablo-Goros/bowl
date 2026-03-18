'use client';

import { Button } from '@/components/ui/button';

type ConfirmToastProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmToast({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmToastProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-4">
      <section
        className="pointer-events-auto w-full max-w-md rounded-[1.75rem] border border-[#dbad49]/18 bg-[linear-gradient(180deg,#342d27_0%,#1c1713_100%)] p-4 text-[#eadab9] shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
        data-testid="confirm-toast"
      >
        <div className="space-y-1">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-[#cdb98f]/76">{description}</p>
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            data-testid="confirm-cancel"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={onConfirm}
            data-testid="confirm-accept"
          >
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
