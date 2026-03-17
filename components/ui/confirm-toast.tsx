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
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <section
        className="pointer-events-auto w-full max-w-md rounded-xl border bg-background p-4 shadow-lg"
        data-testid="confirm-toast"
      >
        <div className="space-y-1">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
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
