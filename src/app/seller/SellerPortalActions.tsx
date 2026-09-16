"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function SellerPortalActions({
  registrationHref,
}: {
  registrationHref: string;
}) {
  const router = useRouter();

  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      <Button type="button" onClick={() => router.push("/login")}>
        Login Seller Utama
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          window.location.href = registrationHref;
        }}
      >
        Ajukan Registrasi
      </Button>
    </div>
  );
}
