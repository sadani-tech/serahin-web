"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function SellerPortalActions() {
  const router = useRouter();

  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      <Button type="button" onClick={() => router.push("/seller/login")}>
        Login Seller
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          document.getElementById("seller-application")?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        Ajukan Registrasi
      </Button>
    </div>
  );
}
