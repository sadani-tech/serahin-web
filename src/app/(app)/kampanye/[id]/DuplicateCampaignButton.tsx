"use client";

import { useActionState } from "react";
import { duplicateCampaign } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";
import { FormError } from "@/components/ui";

export function DuplicateCampaignButton({ campaignId }: { campaignId: string }) {
  const action = duplicateCampaign.bind(null, campaignId);
  const [state, formAction] = useActionState(action, undefined);

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction}>
        <SubmitButton variant="secondary" loadingText="Menduplikasi…">
          Duplikasi
        </SubmitButton>
      </form>
      {state?.error && <FormError message={state.error} />}
    </div>
  );
}
