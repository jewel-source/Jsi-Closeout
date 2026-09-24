const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(price: number | undefined): string | undefined {
  return price === undefined || Number.isNaN(price) ? undefined : priceFormatter.format(price);
}
