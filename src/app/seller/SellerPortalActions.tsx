"use client";

import Link from "next/link";
import { Icon } from "@/components/revamp/IconSprite";

export function SellerPortalActions() {
  return (
    <div className="btn-row">
      <Link href="/seller/login" className="btn btn--primary btn--sm">
        <span>Masuk sebagai Seller</span>
        <span className="btn__icon"><Icon name="arrow" /></span>
      </Link>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={() => {
          document.getElementById("seller-application")?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        <span>Ajukan Registrasi</span>
        <span className="btn__icon"><Icon name="arrow" /></span>
      </button>
    </div>
  );
}
