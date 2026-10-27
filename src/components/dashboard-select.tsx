"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  label: string;
  accessibleLabel?: string;
  name: string;
  value: string;
  options: { id: string; name: string }[];
  disabled?: boolean;
  onChange?: (value: string) => void;
};

// Keep native keyboard/touch selection while allowing the chosen text to wrap.
export function DashboardSelect(props: Props) {
  return <SelectedField key={props.value} {...props} />;
}

function SelectedField({ label, accessibleLabel, name, value, options, disabled, onChange }: Props) {
  const [selected, setSelected] = useState(value);
  return (
    <label>
      <span className="dashboard-select-label">{label}</span>
      <span className="dashboard-select">
        <span className="dashboard-select-value" aria-hidden="true">
          {options.find((option) => option.id === selected)?.name ?? "Choose an option"}
        </span>
        <ChevronDown size={18} aria-hidden="true" />
        <select aria-label={accessibleLabel ?? label} name={name} value={selected} disabled={disabled} onChange={(event) => {
          setSelected(event.target.value);
          onChange?.(event.target.value);
        }}>
          {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
        </select>
      </span>
    </label>
  );
}
