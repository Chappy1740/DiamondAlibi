"use client";

import type { Outcome } from "@/lib/scoring";

const groups: {
  title: string;
  tone: string;
  choices: { outcome: Outcome; code: string; label: string }[];
}[] = [
  {
    title: "Hits",
    tone: "hit",
    choices: [
      { outcome: "Hit", code: "H", label: "Hit" },
      { outcome: "Fence HR", code: "HR", label: "Fence home run" },
      { outcome: "ITP HR", code: "ITP HR", label: "Inside-the-park HR" },
    ],
  },
  {
    title: "Outs",
    tone: "out",
    choices: [
      { outcome: "K", code: "K", label: "Strikeout" },
      { outcome: "Out", code: "OUT", label: "Out" },
    ],
  },
  {
    title: "Other",
    tone: "other",
    choices: [
      { outcome: "BB", code: "BB", label: "Walk" },
      { outcome: "HBP", code: "HBP", label: "Hit by pitch" },
      { outcome: "SF", code: "SF", label: "Sacrifice fly" },
      { outcome: "ROE", code: "E", label: "Reached on error" },
    ],
  },
];

export function BattingOutcomePicker({
  value,
  onChange,
  disabled,
  onPick,
  extended = false,
}: {
  extended?: boolean;
  value: Outcome;
  onChange: (outcome: Outcome) => void;
  disabled: boolean;
  onPick?: (outcome: Outcome) => void;
}) {
  return (
    <div className="batting-outcomes" role="group" aria-label="Batting outcome">
      {groups.map((group) => (
        <div
          className={`batting-outcome-group batting-outcome-group--${group.tone}`}
          key={group.title}
          role="group"
          aria-label={group.title}
        >
          <p className="batting-outcome-heading">{group.title}</p>
          <div className="batting-outcome-grid">
            {(extended && group.title === "Outs" ? [
              {outcome:"K Swinging" as Outcome,code:"K",label:"Strikeout swinging"},
              {outcome:"K Looking" as Outcome,code:"ꓘ",label:"Strikeout looking"},
              {outcome:"SOFO" as Outcome,code:"SOFO",label:"Strikeout foul out"},
              {outcome:"DP" as Outcome,code:"DP",label:"Hit into double play"},
              {outcome:"Out" as Outcome,code:"OUT",label:"Out"},
            ] : group.choices).map((choice) => (
              <button
                key={choice.outcome}
                type="button"
                aria-label={choice.label}
                aria-pressed={value === choice.outcome}
                disabled={disabled}
                onClick={() => {
                  if (onPick) onPick(choice.outcome);
                  else if (value !== choice.outcome) onChange(choice.outcome);
                }}
              >
                <strong aria-hidden="true">{choice.code}</strong>
                <span aria-hidden="true">{choice.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
