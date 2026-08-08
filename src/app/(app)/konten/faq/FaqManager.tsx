"use client";

import { useActionState, useState } from "react";
import {
  Button,
  Card,
  Field,
  FormError,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { badge } from "@/lib/domain";
import { createFaq, updateFaq, deleteFaq, type KontenFormState } from "../actions";

type CampaignOption = { id: string; namaProduk: string };
type Faq = {
  id: string;
  pertanyaan: string;
  jawaban: string;
  urutan: number;
  aktif: boolean;
  campaignId: string | null;
};

export function FaqManager({
  faqs,
  campaigns,
}: {
  faqs: Faq[];
  campaigns: CampaignOption[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const campaignName = (id: string | null) =>
    id ? (campaigns.find((c) => c.id === id)?.namaProduk ?? "Kampanye") : null;

  return (
    <div className="space-y-8">
      <Card className="p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          Tambah FAQ
        </h2>
        <FaqFields action={createFaq} campaigns={campaigns} submitLabel="Tambah FAQ" />
      </Card>

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">
          Daftar FAQ ({faqs.length})
        </h2>
        {faqs.length === 0 ? (
          <Card className="p-8 text-center text-sm text-slate-500">
            Belum ada FAQ. Tambahkan pertanyaan pertama di atas.
          </Card>
        ) : (
          faqs.map((f) => (
            <Card key={f.id} className="p-5">
              {editingId === f.id ? (
                <div className="space-y-4">
                  <FaqFields
                    action={updateFaq.bind(null, f.id)}
                    campaigns={campaigns}
                    initial={f}
                    submitLabel="Simpan"
                    onDone={() => setEditingId(null)}
                  />
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-xs text-slate-500 hover:underline"
                  >
                    Batal edit
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-400">
                        #{f.urutan}
                      </span>
                      <p className="font-medium text-slate-900">
                        {f.pertanyaan}
                      </p>
                      {f.campaignId ? (
                        <span className={badge("bg-indigo-100 text-indigo-800 ring-indigo-600/20")}>
                          {campaignName(f.campaignId)}
                        </span>
                      ) : (
                        <span className={badge("bg-slate-100 text-slate-600 ring-slate-600/20")}>
                          Global
                        </span>
                      )}
                      {!f.aktif && (
                        <span className={badge("bg-rose-100 text-rose-700 ring-rose-600/20")}>
                          Nonaktif
                        </span>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                      {f.jawaban}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(f.id)}
                      className="text-sm font-medium text-slate-600 hover:underline"
                    >
                      Edit
                    </button>
                    <DeleteFaqButton id={f.id} />
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function FaqFields({
  action,
  campaigns,
  initial,
  submitLabel,
  onDone,
}: {
  action: (prev: KontenFormState, fd: FormData) => Promise<KontenFormState>;
  campaigns: CampaignOption[];
  initial?: Faq;
  submitLabel: string;
  onDone?: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: KontenFormState, fd: FormData) => {
      const res = await action(prev, fd);
      if (!res?.error) onDone?.();
      return res;
    },
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <FormError message={state.error} />}
      <Field label="Pertanyaan" required>
        <Input
          name="pertanyaan"
          defaultValue={initial?.pertanyaan}
          required
          placeholder="mis. Bagaimana cara membayar DP?"
        />
      </Field>
      <Field label="Jawaban" required>
        <Textarea
          name="jawaban"
          defaultValue={initial?.jawaban}
          rows={3}
          required
          placeholder="Tulis jawaban di sini…"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Cakupan">
          <Select
            name="campaignId"
            defaultValue={initial?.campaignId ?? ""}
          >
            <option value="">Global (semua kampanye)</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.namaProduk}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Urutan">
          <Input
            type="number"
            name="urutan"
            min={0}
            defaultValue={initial?.urutan ?? 0}
          />
        </Field>
        <Field label="Status">
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="aktif"
              defaultChecked={initial?.aktif ?? true}
              className="h-4 w-4 rounded border-slate-300"
            />
            Aktif (tampil publik)
          </label>
        </Field>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan…" : submitLabel}
      </Button>
    </form>
  );
}

function DeleteFaqButton({ id }: { id: string }) {
  return (
    <form action={deleteFaq.bind(null, id)}>
      <button
        type="submit"
        className="text-sm font-medium text-rose-600 hover:underline"
      >
        Hapus
      </button>
    </form>
  );
}
