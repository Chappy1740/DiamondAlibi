import type { ScoreRow } from "./scorebook-view";

/** Show the official result; original inputs remain intact for audited corrections. */
export function scoreRowSummary(row: Pick<ScoreRow, "official" | "runs" | "rbi" | "voided">): string {
  if (row.voided) return "Voided";
  if (row.official === "OLHR") return "Out";
  return `${row.official} · ${row.runs} runs, ${row.rbi} RBI`;
}
