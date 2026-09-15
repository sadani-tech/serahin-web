import type { ReactNode } from "react";
import { SerahinLogo } from "@/components/brand";
import { PublicFooter } from "@/components/PublicFooter";

export function AuthShell({ title, copy, children }: { title: string; copy: string; children: ReactNode }) {
  return <div className="bg-serahin-dots flex min-h-full flex-1 flex-col"><main className="flex flex-1 items-center justify-center px-4 py-12"><div className="w-full max-w-md"><div className="mb-6 flex justify-center"><SerahinLogo size="lg" /></div><div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-lg"><div className="bg-serahin-ribbon h-1.5"/><div className="p-6"><h1 className="text-xl font-extrabold text-sand-900">{title}</h1><p className="mb-5 mt-1 text-sm text-sand-500">{copy}</p>{children}</div></div></div></main><PublicFooter /></div>;
}
