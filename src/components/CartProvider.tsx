"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/Toast";

export type CartItem = {
  variantId: string;
  name: string;
  price: number;
  promoMinQuantity?: number | null;
  promoDiscountPerUnit?: number | null;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  image?: string | null;
  colors?: string[];
  sizes?: string[];
  eligible?: boolean;
  invalidReason?: string | null;
};

export type CartDraft = {
  salesEventId: string;
  eventTitle: string;
  formToken: string;
  sellerId?: string | null;
  sellerName: string;
  endsAt: string;
  items: CartItem[];
};

type CartContextValue = {
  /** v2.4.1 Portal Toko: Buyer bisa punya beberapa cart sekaligus, satu per
   * Batch PO. `carts` berisi semuanya; `activeEventId` menandai cart yang
   * sedang ditampilkan di halaman `/cart`. */
  carts: CartDraft[];
  activeEventId: string | null;
  setActiveEvent: (salesEventId: string) => void;
  count: number;
  ready: boolean;
  authenticated: boolean;
  addItem: (event: Omit<CartDraft, "items">, item: CartItem) => Promise<boolean>;
  setQuantity: (salesEventId: string, variantId: string, selectedColor: string | undefined, selectedSize: string | undefined, quantity: number) => void;
  syncCart: (salesEventId: string) => Promise<void>;
  setColor: (salesEventId: string, variantId: string, selectedColor: string | undefined, selectedSize: string | undefined, nextColor: string) => void;
  setSize: (salesEventId: string, variantId: string, selectedColor: string | undefined, selectedSize: string | undefined, nextSize: string) => void;
  removeItem: (salesEventId: string, variantId: string, selectedColor?: string, selectedSize?: string) => void;
  clearOne: (salesEventId: string) => void;
  clearAll: () => void;
};

type RemoteCart = {
  salesEvent: {
    id: string;
    title: string;
    publicToken: string;
    endsAt: string;
    seller: { id?: string; businessName: string } | null;
  };
  items: Array<{
    variantId: string;
    name: string;
    price: number | null;
    promoMinQuantity?: number | null;
    promoDiscountPerUnit?: number | null;
    quantity: number;
    selectedColor: string | null;
    selectedSize: string | null;
    image: string | null;
    colors?: string[];
    sizes?: string[];
    eligible?: boolean;
    invalidReason?: string | null;
  }>;
};

const STORAGE_KEY = "serahin:cart:v2.4";
const CartContext = createContext<CartContextValue | null>(null);

function sameItem(a: CartItem, b: Pick<CartItem, "variantId" | "selectedColor" | "selectedSize">) {
  return a.variantId === b.variantId && (a.selectedColor ?? "") === (b.selectedColor ?? "") && (a.selectedSize ?? "") === (b.selectedSize ?? "");
}

function mergeSelections(items: CartItem[]): CartItem[] {
  const merged: CartItem[] = [];
  for (const item of items) {
    const existing = merged.find((candidate) => sameItem(candidate, item));
    if (existing) existing.quantity += item.quantity;
    else merged.push({ ...item });
  }
  return merged;
}

function remoteToDraft(remote: RemoteCart): CartDraft {
  return {
    salesEventId: remote.salesEvent.id,
    eventTitle: remote.salesEvent.title,
    formToken: remote.salesEvent.publicToken,
    sellerId: remote.salesEvent.seller?.id ?? null,
    sellerName: remote.salesEvent.seller?.businessName ?? "Serahin",
    endsAt: remote.salesEvent.endsAt,
    items: remote.items.filter((item) => item.price !== null).map((item) => ({
      variantId: item.variantId, name: item.name, price: item.price!, quantity: item.quantity,
      promoMinQuantity: item.promoMinQuantity, promoDiscountPerUnit: item.promoDiscountPerUnit,
      selectedColor: item.selectedColor ?? undefined, selectedSize: item.selectedSize ?? undefined, image: item.image, colors: item.colors, sizes: item.sizes,
      eligible: item.eligible, invalidReason: item.invalidReason,
    })),
  };
}

export function CartProvider({ authenticated, children }: { authenticated: boolean; children: React.ReactNode }) {
  const [carts, setCarts] = useState<CartDraft[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const toast = useToast();
  const syncQueue = useRef(new Map<string, Promise<void>>());

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as CartDraft[];
          setCarts(parsed);
          setActiveEventId(parsed[0]?.salesEventId ?? null);
        }
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
    if (carts.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(carts));
    else localStorage.removeItem(STORAGE_KEY);
  }, [carts, ready]);

  const push = useCallback(async (draft: CartDraft) => {
    if (!authenticated) return;
    const previous = syncQueue.current.get(draft.salesEventId);
    const current = (previous ?? Promise.resolve()).catch(() => undefined).then(async () => {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salesEventId: draft.salesEventId,
          items: draft.items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            selectedColor: item.selectedColor,
            selectedSize: item.selectedSize,
          })),
        }),
      });
      const data = await response.json().catch(() => ({})) as RemoteCart & { message?: string };
      if (!response.ok) throw new Error(data.message ?? "Keranjang belum dapat disinkronkan.");
      if (Array.isArray(data.items)) {
        setCarts((current) => current.map((cart) => {
          if (cart.salesEventId !== draft.salesEventId) return cart;
          let changed = false;
          const items = cart.items.map((item) => {
            const remote = data.items.find((candidate) => candidate.variantId === item.variantId && (candidate.selectedColor ?? "") === (item.selectedColor ?? "") && (candidate.selectedSize ?? "") === (item.selectedSize ?? ""));
            if (!remote || remote.price == null) return item;
            const promoMinQuantity = remote.promoMinQuantity ?? null;
            const promoDiscountPerUnit = remote.promoDiscountPerUnit ?? null;
            const colors = remote.colors ?? [];
            const sizes = remote.sizes ?? [];
            if (item.price === remote.price && (item.promoMinQuantity ?? null) === promoMinQuantity && (item.promoDiscountPerUnit ?? null) === promoDiscountPerUnit && JSON.stringify(item.colors ?? []) === JSON.stringify(colors) && JSON.stringify(item.sizes ?? []) === JSON.stringify(sizes) && item.eligible === remote.eligible && item.invalidReason === remote.invalidReason) return item;
            changed = true;
            return { ...item, price: remote.price, promoMinQuantity, promoDiscountPerUnit, colors, sizes, eligible: remote.eligible, invalidReason: remote.invalidReason };
          });
          return changed ? { ...cart, items } : cart;
        }));
      }
    });
    syncQueue.current.set(draft.salesEventId, current);
    try {
      await current;
    } finally {
      if (syncQueue.current.get(draft.salesEventId) === current) {
        syncQueue.current.delete(draft.salesEventId);
      }
    }
  }, [authenticated]);

  const syncCart = useCallback(async (salesEventId: string) => {
    const draft = carts.find((cart) => cart.salesEventId === salesEventId);
    if (draft) await push(draft);
  }, [carts, push]);

  const synced = useRef(false);
  useEffect(() => {
    if (!ready || !authenticated || synced.current) return;
    synced.current = true;
    const timer = window.setTimeout(async () => {
      if (carts.length) {
        await Promise.all(carts.map((draft) => push(draft).catch(() => undefined)));
        return;
      }
      const response = await fetch("/api/cart/all").catch(() => null);
      if (!response?.ok) return;
      const remotes = await response.json().catch(() => null) as RemoteCart[] | null;
      if (!remotes?.length) return;
      const drafts = remotes.filter((remote) => remote.items.length).map(remoteToDraft);
      if (!drafts.length) return;
      setCarts(drafts);
      setActiveEventId(drafts[0].salesEventId);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [authenticated, carts, push, ready]);

  const addItem = useCallback(async (event: Omit<CartDraft, "items">, item: CartItem) => {
    let next: CartDraft[] = [];
    let draftForEvent: CartDraft | null = null;
    setCarts((current) => {
      const existingCart = current.find((c) => c.salesEventId === event.salesEventId);
      const existingItem = existingCart?.items.find((candidate) => sameItem(candidate, item));
      const items = existingItem
        ? existingCart!.items.map((candidate) => sameItem(candidate, item)
          ? { ...candidate, price: item.price, promoMinQuantity: item.promoMinQuantity, promoDiscountPerUnit: item.promoDiscountPerUnit, quantity: candidate.quantity + item.quantity }
          : candidate)
        : [...(existingCart?.items ?? []), item];
      draftForEvent = { ...event, items };
      next = existingCart
        ? current.map((c) => c.salesEventId === event.salesEventId ? draftForEvent! : c)
        : [...current, draftForEvent];
      return next;
    });
    setActiveEventId(event.salesEventId);
    try {
      if (draftForEvent) await push(draftForEvent);
    } catch {
      toast.warning("Produk tersimpan di perangkat, tetapi keranjang akun belum tersinkron.");
    }
    toast.success(`${item.name} masuk ke keranjang.`);
    return true;
  }, [push, toast]);

  const setQuantity = useCallback((salesEventId: string, variantId: string, selectedColor: string | undefined, selectedSize: string | undefined, quantity: number) => {
    setCarts((current) => {
      const target = current.find((c) => c.salesEventId === salesEventId);
      if (!target) return current;
      const items = target.items
        .map((item) => sameItem(item, { variantId, selectedColor, selectedSize }) ? { ...item, quantity: Math.max(0, quantity) } : item)
        .filter((item) => item.quantity > 0);
      if (!items.length) {
        if (authenticated) void fetch(`/api/cart?salesEventId=${encodeURIComponent(salesEventId)}`, { method: "DELETE" });
        return current.filter((c) => c.salesEventId !== salesEventId);
      }
      const nextDraft = { ...target, items };
      void push(nextDraft).catch(() => undefined);
      return current.map((c) => c.salesEventId === salesEventId ? nextDraft : c);
    });
  }, [authenticated, push]);

  const removeItem = useCallback((salesEventId: string, variantId: string, selectedColor?: string, selectedSize?: string) => {
    setCarts((current) => {
      const target = current.find((c) => c.salesEventId === salesEventId);
      if (!target) return current;
      const items = target.items.filter((item) => !sameItem(item, { variantId, selectedColor, selectedSize }));
      if (!items.length) {
        if (authenticated) void fetch(`/api/cart?salesEventId=${encodeURIComponent(salesEventId)}`, { method: "DELETE" });
        return current.filter((c) => c.salesEventId !== salesEventId);
      }
      const nextDraft = { ...target, items };
      void push(nextDraft).catch(() => undefined);
      return current.map((c) => c.salesEventId === salesEventId ? nextDraft : c);
    });
  }, [authenticated, push]);

  const setColor = useCallback((salesEventId: string, variantId: string, selectedColor: string | undefined, selectedSize: string | undefined, nextColor: string) => {
    setCarts((current) => {
      const target = current.find((c) => c.salesEventId === salesEventId);
      if (!target) return current;
      const items = mergeSelections(target.items.map((item) => sameItem(item, { variantId, selectedColor, selectedSize }) ? { ...item, selectedColor: nextColor } : item));
      const nextDraft = { ...target, items };
      void push(nextDraft).catch(() => undefined);
      return current.map((c) => c.salesEventId === salesEventId ? nextDraft : c);
    });
  }, [push]);

  const setSize = useCallback((salesEventId: string, variantId: string, selectedColor: string | undefined, selectedSize: string | undefined, nextSize: string) => {
    setCarts((current) => {
      const target = current.find((c) => c.salesEventId === salesEventId);
      if (!target) return current;
      const items = mergeSelections(target.items.map((item) => sameItem(item, { variantId, selectedColor, selectedSize }) ? { ...item, selectedSize: nextSize } : item));
      const nextDraft = { ...target, items };
      void push(nextDraft).catch(() => undefined);
      return current.map((c) => c.salesEventId === salesEventId ? nextDraft : c);
    });
  }, [push]);

  const clearOne = useCallback((salesEventId: string) => {
    setCarts((current) => current.filter((c) => c.salesEventId !== salesEventId));
    setActiveEventId((current) => current === salesEventId ? null : current);
    if (authenticated) void fetch(`/api/cart?salesEventId=${encodeURIComponent(salesEventId)}`, { method: "DELETE" });
  }, [authenticated]);

  const clearAll = useCallback(() => {
    setCarts([]);
    setActiveEventId(null);
    if (authenticated) void fetch("/api/cart", { method: "DELETE" });
  }, [authenticated]);

  const setActiveEvent = useCallback((salesEventId: string) => setActiveEventId(salesEventId), []);

  const value = useMemo(() => ({
    carts,
    activeEventId: activeEventId && carts.some((c) => c.salesEventId === activeEventId) ? activeEventId : (carts[0]?.salesEventId ?? null),
    setActiveEvent,
    count: carts.reduce((sum, c) => sum + c.items.reduce((s, item) => s + item.quantity, 0), 0),
    ready,
    authenticated,
    addItem,
    setQuantity,
    syncCart,
    setColor,
    setSize,
    removeItem,
    clearOne,
    clearAll,
  }), [activeEventId, addItem, authenticated, carts, clearAll, clearOne, ready, removeItem, setActiveEvent, setColor, setSize, setQuantity, syncCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart harus dipakai di dalam CartProvider");
  return context;
}
