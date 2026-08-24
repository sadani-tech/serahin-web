"use client";

import { useState } from "react";
import { Button, Select, Textarea } from "@/components/ui";
import {
  CAMPAIGN_STATUS_LABEL,
  CAMPAIGN_STATUS_ORDER,
} from "@/lib/domain";
import { CampaignStatus } from "@/lib/types";
import { changeCampaignStatus } from "../actions";

export function StatusControl({
  campaignId,
  current,
}: {
  campaignId: string;
  current: CampaignStatus;
}) {
  const [target, setTarget] = useState<CampaignStatus>(current);
  const changed = target !== current;
  const action = changeCampaignStatus.bind(null, campaignId);

  return (
    <form
      action={async (formData: FormData) => {
        await action(formData);
      }}
      className="space-y-3"
    >
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1">
          <label className="mb-1 block text-sm font-medium text-sand-700">
            Ubah status kampanye
          </label>
          <Select
            name="status"
            value={target}
            onChange={(e) => setTarget(e.target.value as CampaignStatus)}
          >
            {CAMPAIGN_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {CAMPAIGN_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" disabled={!changed}>
          Simpan status
        </Button>
      </div>
      {changed && (
        <Textarea
          name="catatan"
          rows={2}
          placeholder="Catatan (opsional) — mis. alasan perubahan status. Akan tercatat di timeline."
        />
      )}
      <p className="text-xs text-sand-500">
        Perubahan status otomatis tercatat di timeline kampanye.
      </p>
    </form>
  );
}
