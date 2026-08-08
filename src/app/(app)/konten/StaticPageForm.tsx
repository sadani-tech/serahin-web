"use client";

import { useActionState } from "react";
import {
  Button,
  Card,
  Field,
  FormError,
  Input,
  Select,
} from "@/components/ui";
import { RichTextEditor } from "@/components/RichTextEditor";
import type { KontenFormState } from "./actions";

export function StaticPageForm({
  action,
  initial,
  submitLabel,
}: {
  action: (
    prev: KontenFormState,
    formData: FormData,
  ) => Promise<KontenFormState>;
  initial?: {
    judul?: string;
    slug?: string;
    konten?: string;
    status?: "DRAFT" | "PUBLISH";
    urutan?: number;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && <FormError message={state.error} />}
      <Card className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Judul halaman" required>
            <Input
              name="judul"
              defaultValue={initial?.judul}
              required
              placeholder="mis. Syarat & Ketentuan"
            />
          </Field>
          <Field
            label="Slug URL"
            hint="Kosongkan untuk dibuat otomatis dari judul. Contoh: syarat-ketentuan"
          >
            <Input
              name="slug"
              defaultValue={initial?.slug}
              placeholder="syarat-ketentuan"
            />
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue={initial?.status ?? "DRAFT"}>
              <option value="DRAFT">Draft (belum tampil publik)</option>
              <option value="PUBLISH">Publish (tampil di footer publik)</option>
            </Select>
          </Field>
          <Field label="Urutan di footer" hint="Angka kecil tampil lebih dulu">
            <Input
              type="number"
              name="urutan"
              min={0}
              defaultValue={initial?.urutan ?? 0}
            />
          </Field>
        </div>

        <Field label="Konten" required>
          <RichTextEditor
            name="konten"
            defaultValue={initial?.konten ?? ""}
            placeholder="Tulis isi halaman di sini…"
          />
        </Field>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
