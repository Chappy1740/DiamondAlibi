import type { ConnectedGame } from "@/lib/scorebook-view";

const baseFields = [
  ["strikeout", "Strikeout"],
  ["solo", "Solo fence HR"],
  ["band_solo", "Solo fence HR with Band"],
  ["grand_slam", "Grand slam"],
  ["over_limit", "Over-limit HR"],
  ["inside_park", "Inside-the-park HR"],
  ["multi_run", "Other multi-run HR"],
] as const;

/** Display the selected game's snapshot, never today's team defaults. */
export function SavedGameRules({ rules }: { rules: ConnectedGame["rules"] }) {
  const extended = [
    ["strikeout_looking", "Strikeout looking"], ["strikeout_swinging", "Strikeout swinging"],
    ["strikeout_foul", "Strikeout foul out (SOFO)"], ["double_play", "Hit into double play"],
  ] as const;
  const fields = [...baseFields, ...extended.filter(([key]) => typeof rules[key] === "number")];
  return <details className="saved-game-rules">
    <summary>Saved Beverage Rules for this game</summary>
    <p className="micro">These values belong to this game. Changing team defaults applies to new games.</p>
    <p className="micro">Positive adds to what’s owed; negative adds credit. Participation and HR Bands still apply.</p>
    <dl className="beverage-rule-list">
      {fields.map(([key, label]) => {
        const value = rules[key];
        return <div key={key}><dt>{key === "strikeout" && fields.length > baseFields.length ? "Unspecified strikeout (legacy)" : label}</dt><dd>{typeof value === "number" && Number.isFinite(value) ? (value > 0 ? "+" + value : String(value)) : "Unavailable"}</dd></div>;
      })}
    </dl>
    <p className="micro">Rule version: {rules.version_label || "Unavailable"}</p>
  </details>;
}
