const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** $40, $85, $7 … (sin decimales si son enteros) */
export function formatPrice(value: number): string {
  return mxn.format(value).replace(/\u00a0/g, "");
}
