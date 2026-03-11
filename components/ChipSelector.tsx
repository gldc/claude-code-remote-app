import React from 'react';
import { ChipGroup } from './ui/ChipGroup';

interface ChipSelectorProps {
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  label?: string;
}

export const ChipSelector = React.memo(function ChipSelector({
  options, selected, onToggle, label,
}: ChipSelectorProps) {
  return (
    <ChipGroup
      options={options}
      label={label}
      selected={selected}
      onSelect={onToggle}
      multi
    />
  );
});
