export type QuantityPromo = {
  price: number;
  promoMinQuantity?: number | null;
  promoDiscountPerUnit?: number | null;
};

export function effectiveUnitPrice(offering: QuantityPromo, quantity: number): number {
  return offering.promoMinQuantity != null && quantity >= offering.promoMinQuantity
    ? Math.max(0, offering.price - (offering.promoDiscountPerUnit ?? 0))
    : offering.price;
}

export function cartTotal(items: Array<QuantityPromo & { variantId: string; quantity: number }>): number {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  return items.reduce((sum, item) => sum + effectiveUnitPrice(item, totalQuantity) * item.quantity, 0);
}
