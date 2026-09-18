import type { SVGProps } from "react";
import type { IconName } from "@/lib/landing-content";

type IconProps = SVGProps<SVGSVGElement> & { name: IconName };

const paths: Record<IconName, React.ReactNode> = {
  campaign: <><path d="M5 6.5h14M7 3.5v6m10-6v6M5 10h14v9.5H5z"/><path d="M8.5 14h3m-3 3h7"/></>,
  orders: <><path d="M7 4h10v16H7z"/><path d="M9.5 8h5m-5 4h5m-5 4h3"/><path d="M4 7V3h10"/></>,
  payment: <><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18m-4 4h1"/></>,
  timeline: <><path d="M6 4v16"/><circle cx="6" cy="7" r="2"/><circle cx="6" cy="16" r="2"/><path d="M10 7h8m-8 9h6"/></>,
  portal: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6m-6 4h6m-6 4h3"/><circle cx="16" cy="18" r=".7" fill="currentColor" stroke="none"/></>,
  vendor: <><path d="M4 9h16l-1.5-5h-13z"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
  report: <><path d="M4 20h16"/><path d="M6 17v-5h3v5m2 0V7h3v10m2 0V3h3v14"/></>,
  catalog: <><rect x="3" y="4" width="8" height="7" rx="1"/><rect x="13" y="4" width="8" height="7" rx="1"/><rect x="3" y="13" width="8" height="7" rx="1"/><rect x="13" y="13" width="8" height="7" rx="1"/></>,
  whatsapp: <><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.4-4A8 8 0 1 1 20 11.5Z"/><path d="M9 8c.5 3 2 4.5 5 5l1-1.2 2 .9c-.3 1.7-1.5 2.5-3.2 2.3-4-.6-6.2-2.8-6.8-6.8C6.8 6.5 7.6 5.3 9.3 5l.9 2z"/></>,
  seller: <><circle cx="12" cy="7" r="3"/><path d="M5 20c.5-4.5 2.8-7 7-7s6.5 2.5 7 7"/></>,
  owner: <><path d="M4 19h16M6 17V9m4 8V9m4 8V9m4 8V9M3 7l9-4 9 4z"/></>,
  shield: <><path d="M12 3l7 3v5c0 4.4-2.4 7.7-7 10-4.6-2.3-7-5.6-7-10V6z"/><path d="m9 12 2 2 4-4"/></>,
};

export function Icon({ name, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {paths[name]}
    </svg>
  );
}
export function ArrowIcon(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}><path d="M4 10h11m-4-4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}><path d="m4 10 4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
