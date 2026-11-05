"use client";

import type { Outcome } from "@/lib/scoring";

const groups: {
  title: string;
  clubhouseTitle: string;
  tone: string;
  choices: { outcome: Outcome; code: string; label: string }[];
}[] = [
  {
    title: "Hits",
    clubhouseTitle: "The Ego Boosters",
    tone: "hit",
    choices: [
      { outcome: "1B", code: "1B", label: "Single" },
      { outcome: "2B", code: "2B", label: "Double" },
      { outcome: "3B", code: "3B", label: "Triple" },
      { outcome: "Fence HR", code: "HR", label: "Fence home run" },
      { outcome: "ITP HR", code: "ITP HR", label: "Inside-the-park HR" },
    ],
  },
  {
    title: "Outs",
    clubhouseTitle: "The Hall of Shame",
    tone: "out",
    choices: [
      { outcome: "K", code: "K", label: "Strikeout" },
      { outcome: "Out", code: "OUT", label: "Out" },
    ],
  },
  {
    title: "Other",
    clubhouseTitle: "Participation Trophies",
    tone: "other",
    choices: [
      { outcome: "BB", code: "BB", label: "Walk" },
      { outcome: "SF", code: "SF", label: "Sacrifice fly" },
      { outcome: "ROE", code: "E", label: "Reached on error" },
    ],
  },
];

const clubhouseSubtitles: Partial<Record<Outcome, string>> = {
  "1B": "Even a Blind Squirrel",
  "2B": "Two Bases? Alert the Media",
  "3B": "Somebody Get the Oxygen",
  "Fence HR": "The Fence Never Had a Chance",
  "ITP HR": "Four Bases, Zero Breath",
  "K Swinging": "All Swing, No Talent",
  "K Looking": "Bat's Just for Decoration",
  SOFO: "Fouled Up Everything",
  DP: "Two Outs, One Bad Idea",
  Out: "Sit Down, Superstar",
  BB: "Free Pass, Zero Effort",
  SF: "Congrats, You Failed Up",
  ROE: "Defense Felt Sorry for You",
};

export function BattingOutcomePicker({
  value,
  onChange,
  disabled,
  onPick,
  extended = false,
  hitTypes = true,
  clubhouseLabels = false,
}: {
  extended?: boolean;
  hitTypes?: boolean;
  clubhouseLabels?: boolean;
  value: Outcome | null;
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
          <p className="batting-outcome-heading">{clubhouseLabels ? group.clubhouseTitle : group.title}</p>
          <div className="batting-outcome-grid">
            {(extended && group.title === "Outs" ? [
              {outcome:"K Swinging" as Outcome,code:"K",label:"Strikeout swinging"},
              {outcome:"K Looking" as Outcome,code:"ꓘ",label:"Strikeout looking"},
              {outcome:"SOFO" as Outcome,code:"SOFO",label:"Strikeout foul out"},
              {outcome:"DP" as Outcome,code:"DP",label:"Hit into double play"},
              {outcome:"Out" as Outcome,code:"OUT",label:"Out"},
            ] : !hitTypes && group.title === "Hits" ? [
              {outcome: "Hit" as Outcome, code: "H", label: "Hit"},
              ...group.choices.filter(choice => !["1B", "2B", "3B"].includes(choice.outcome)),
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
                <span aria-hidden="true">{clubhouseLabels ? clubhouseSubtitles[choice.outcome] ?? choice.label : choice.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
