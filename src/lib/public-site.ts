export const publicSite = {
  name: "Serahin",
  legalName:
    process.env.NEXT_PUBLIC_LEGAL_NAME || "PT Sadani Teknologi Indonesia",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://serahin.suraise.com",
  email:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "suryadanikmah@gmail.com",
  phoneDisplay:
    process.env.NEXT_PUBLIC_SUPPORT_PHONE_DISPLAY || "0851 1151 0038",
  phoneHref:
    process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+6285111510038",
  location:
    process.env.NEXT_PUBLIC_BUSINESS_LOCATION ||
    "Sukoharjo, Jawa Tengah, Indonesia",
  policyVersion:
    process.env.NEXT_PUBLIC_POLICY_VERSION || "2026-09-10",
  whatsappConsentVersion:
    process.env.NEXT_PUBLIC_WHATSAPP_CONSENT_VERSION || "2026-09-10",
} as const;

export const requiredLegalLinks = [
  { href: "/about", label: "Tentang" },
  { href: "/contact", label: "Kontak" },
  { href: "/terms", label: "Syarat & Ketentuan" },
  { href: "/refund-policy", label: "Kebijakan Refund" },
  { href: "/privacy", label: "Kebijakan Privasi" },
  { href: "/data-deletion", label: "Penghapusan Data" },
] as const;
