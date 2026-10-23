/** Presentation only: never round the values used for calculations or rankings. */
export function formatBaseballRate(value: number | null | undefined): string {
  return value == null ? "—" : value.toFixed(3).replace(/^0/, "");
}
