"use client";

import { useState } from "react";

export default function QuantityInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: number;
  onChange: (quantity: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      value={draft ?? String(value)}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
        setDraft(digits);
        const parsed = parseInt(digits, 10);
        if (parsed >= 1) onChange(parsed);
      }}
      onBlur={() => setDraft(null)}
      className="w-20 h-10 border border-[var(--color-accent)]/30 rounded-md px-2 text-center"
    />
  );
}
