import { redirect } from "next/navigation";

// Daftar pesanan dikelompokkan di dalam Batch PO agar scope Seller dan
// konteks kampanye tetap terlihat. Route ini dipertahankan untuk link lama
// dari sidebar, bookmark, dan dashboard.
export default function OrdersIndexPage() {
  redirect("/pre-orders");
}
