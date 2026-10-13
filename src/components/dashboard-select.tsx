"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  label: string;
  accessibleLabel?: string;
  name: string;
  value: string;
  options: { id: string; name: string }[];
};

// Keep native keyboard/touch selection while allowing the chosen text to wrap.
export function DashboardSelect(props: Props) {
  return <SelectedField key={props.value} {...props} />;
}

function SelectedField({ label, accessibleLabel, name, value, options }: Props) {
  const [selected, setSelected] = useState(value);
  return (
    <label>
      {label}
      <span className="dashboard-select">
        <span className="dashboard-select-value" aria-hidden="true">
          {options.find((option) => option.id === selected)?.name ?? "Choose an option"}
        </span>
        <ChevronDown size={18} aria-hidden="true" />
        <select aria-label={accessibleLabel ?? label} name={name} value={selected} onChange={(event) => setSelected(event.target.value)}>
          {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
        </select>
      </span>
    </label>
  );
}
