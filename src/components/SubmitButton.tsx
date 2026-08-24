"use client";

import { type ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";
import { useOverlayWhilePending } from "@/hooks/useNavLoading";

// Tombol submit untuk <form action={serverAction}>. Otomatis menampilkan
// spinner + menonaktifkan tombol saat aksi berjalan (useFormStatus), sekaligus
// memicu overlay loading global agar konsisten "seperti navbar".

export function SubmitButton({
  children,
  loadingText,
  disabled,
  ...props
}: ComponentProps<typeof Button> & { loadingText?: string }) {
  const { pending } = useFormStatus();
  useOverlayWhilePending(pending);

  return (
    <Button
      type="submit"
      {...props}
      loading={pending}
      disabled={disabled || pending}
    >
      {pending && loadingText ? loadingText : children}
    </Button>
  );
}
