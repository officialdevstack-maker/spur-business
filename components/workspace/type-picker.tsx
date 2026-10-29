"use client";

import type { WorkspaceType } from "@/lib/constants";

const OPTIONS: {
  value: WorkspaceType;
  title: string;
  description: string;
}[] = [
  {
    value: "vtu",
    title: "VTU business",
    description: "Sell airtime, data and bill payments.",
  },
  {
    value: "school",
    title: "School",
    description: "Manage fees and get your own school site.",
  },
];

export function TypePicker({
  value,
  onChange,
}: {
  value: WorkspaceType;
  onChange: (type: WorkspaceType) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {OPTIONS.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`rounded-xl border p-4 text-left transition ${
              active
                ? "border-[#F2B632] bg-[#F2B632]/10"
                : "border-[#12343B]/10 bg-white hover:border-[#12343B]/30"
            }`}
          >
            <p className="font-semibold">{option.title}</p>
            <p className="mt-1 text-sm text-[#4C6267]">{option.description}</p>
          </button>
        );
      })}
    </div>
  );
}
