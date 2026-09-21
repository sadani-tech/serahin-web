"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmDialog";

export type CartItem = {
  variantId: string;
  name: string;
  price: number;
  quantity: number;
  selectedColor?: string;
  image?: string | null;
  colors?: string[];
  eligible?: boolean;
  invalidReason?: string | null;
};

export type CartDraft = {
  salesEventId: string;
  eventTitle: string;
  formToken: string;
  sellerName: string;
  endsAt: string;
  items: CartItem[];
};

type CartContextValue = {
  cart: CartDraft | null;
  count: number;
  ready: boolean;
  authenticated: boolean;
  syncConflict: boolean;
  addItem: (event: Omit<CartDraft, "items">, item: CartItem) => Promise<boolean>;
  setQuantity: (variantId: string, selectedColor: string | undefined, quantity: number) => void;
  setColor: (variantId: string, selectedColor: string | undefined, nextColor: string) => void;
  removeItem: (variantId: string, selectedColor?: string) => void;
  clear: () => void;
  sync: (choice?: "KEEP_REMOTE" | "REPLACE_WITH_LOCAL") => Promise<void>;
};

type RemoteCart = {
  salesEvent: {
    id: string;
    title: string;
    publicToken: string;
    endsAt: string;
    seller: { businessName: string } | null;
  };
  items: Array<{
    variantId: string;
    name: string;
    price: number | null;
    quantity: number;
    selectedColor: string | null;
    image: string | null;
    colors?: string[];
    eligible?: boolean;
    invalidReason?: string | null;
  }>;
};

const STORAGE_KEY = "serahin:cart:v2.3";
const CartContext = createContext<CartContextValue | null>(null);

function sameItem(a: CartItem, b: Pick<CartItem, "variantId" | "selectedColor">) {
  return a.variantId === b.variantId && (a.selectedColor ?? "") === (b.selectedColor ?? "");
}

export function CartProvider({ authenticated, children }: { authenticated: boolean; children: React.ReactNode }) {
  const [cart, setCart] = useState<CartDraft | null>(null);
  const [ready, setReady] = useState(false);
  const [syncConflict, setSyncConflict] = useState(false);
  const syncResolved = useRef(false);
  const toast = useToast();
  const { confirm } = useConfirm();

  const applyRemote = useCallback((remote: RemoteCart) => {
    setCart({
      salesEventId: remote.salesEvent.id, eventTitle: remote.salesEvent.title,
      formToken: remote.salesEvent.publicToken,
      sellerName: remote.salesEvent.seller?.businessName ?? "Serahin",
      endsAt: remote.salesEvent.endsAt,
      items: remote.items.filter((item) => item.price !== null).map((item) => ({
        variantId: item.variantId, name: item.name, price: item.price!, quantity: item.quantity,
        selectedColor: item.selectedColor ?? undefined, image: item.image, colors: item.colors,
        eligible: item.eligible, invalidReason: item.invalidReason,
      })),
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setCart(JSON.parse(raw) as CartDraft);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (cart) localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    else localStorage.removeItem(STORAGE_KEY);
  }, [cart, ready]);

  const push = useCallback(async (draft: CartDraft, choice?: "KEEP_REMOTE" | "REPLACE_WITH_LOCAL") => {
    if (!authenticated) return;
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salesEventId: draft.salesEventId,
        conflictResolution: choice ?? (syncResolved.current ? "REPLACE_WITH_LOCAL" : undefined),
        items: draft.items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
        })),
      }),
    });
    const data = await response.json().catch(() => ({})) as (RemoteCart & { conflict?: boolean; remote?: RemoteCart; message?: string });
    if (data.conflict) {
      setSyncConflict(true);
      return;
    }
    if (!response.ok) {
      throw new Error(data.message ?? "Keranjang belum dapat disinkronkan.");
    }
    if (choice === "KEEP_REMOTE" && data.items) applyRemote(data);
    syncResolved.current = true;
    setSyncConflict(false);
  }, [applyRemote, authenticated]);

  useEffect(() => {
    if (!ready || !authenticated) return;
    const timer = window.setTimeout(async () => {
      if (cart) {
        await push(cart).catch(() => undefined);
        return;
      }
      const response = await fetch("/api/cart").catch(() => null);
      if (!response?.ok) return;
      const remote = await response.json() as RemoteCart | null;
      if (!remote?.items.length) return;
      applyRemote(remote);
      syncResolved.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [applyRemote, authenticated, cart, push, ready]);

  const addItem = useCallback(async (event: Omit<CartDraft, "items">, item: CartItem) => {
    let next: CartDraft;
    if (cart && cart.salesEventId !== event.salesEventId) {
      const replace = await confirm({
        title: "Ganti isi keranjang?",
        description: "Keranjang Serahin hanya dapat berisi satu Batch PO. Produk dari Batch PO sebelumnya akan diganti.",
        confirmLabel: "Ganti keranjang",
        variant: "primary",
      });
      if (!replace) return false;
      next = { ...event, items: [item] };
    } else {
      const existing = cart?.items.find((candidate) => sameItem(candidate, item));
      const items = existing
        ? cart!.items.map((candidate) => sameItem(candidate, item)
          ? { ...candidate, quantity: candidate.quantity + item.quantity }
          : candidate)
        : [...(cart?.items ?? []), item];
      next = { ...(cart ?? event), ...event, items };
    }
    setCart(next);
    try {
      await push(next, cart && cart.salesEventId !== event.salesEventId ? "REPLACE_WITH_LOCAL" : undefined);
    } catch {
      // Draft lokal tetap menjadi sumber pemulihan bila jaringan terputus.
      toast.warning("Produk tersimpan di perangkat, tetapi keranjang akun belum tersinkron.");
    }
    toast.success(`${item.name} masuk ke keranjang.`);
    return true;
  }, [cart, confirm, push, toast]);

  const setQuantity = useCallback((variantId: string, selectedColor: string | undefined, quantity: number) => {
    setCart((current) => {
      if (!current) return current;
      const items = current.items
        .map((item) => sameItem(item, { variantId, selectedColor }) ? { ...item, quantity: Math.max(0, quantity) } : item)
        .filter((item) => item.quantity > 0);
      const next = items.length ? { ...current, items } : null;
      if (next) void push(next).catch(() => undefined);
      return next;
    });
  }, [push]);

  const removeItem = useCallback((variantId: string, selectedColor?: string) => {
    setCart((current) => {
      if (!current) return current;
      const items = current.items.filter((item) => !sameItem(item, { variantId, selectedColor }));
      const next = items.length ? { ...current, items } : null;
      if (next) void push(next).catch(() => undefined);
      else if (authenticated) void fetch("/api/cart", { method: "DELETE" });
      return next;
    });
  }, [authenticated, push]);

  const setColor = useCallback((variantId: string, selectedColor: string | undefined, nextColor: string) => {
    setCart((current) => {
      if (!current) return current;
      const items = current.items.map((item) => sameItem(item, { variantId, selectedColor }) ? { ...item, selectedColor: nextColor } : item);
      const next = { ...current, items };
      void push(next).catch(() => undefined);
      return next;
    });
  }, [push]);

  const clear = useCallback(() => {
    setCart(null);
    setSyncConflict(false);
    if (authenticated) void fetch("/api/cart", { method: "DELETE" });
  }, [authenticated]);

  const sync = useCallback(async (choice?: "KEEP_REMOTE" | "REPLACE_WITH_LOCAL") => {
    if (cart) await push(cart, choice);
  }, [cart, push]);

  const value = useMemo(() => ({
    cart,
    count: cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    ready,
    authenticated,
    syncConflict,
    addItem,
    setQuantity,
    setColor,
    removeItem,
    clear,
    sync,
  }), [addItem, authenticated, cart, clear, ready, removeItem, setColor, setQuantity, sync, syncConflict]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart harus dipakai di dalam CartProvider");
  return context;
}
