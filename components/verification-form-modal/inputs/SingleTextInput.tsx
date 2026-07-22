"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

interface SingleTextInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export default function SingleTextInput({
  value,
  onChange,
  placeholder = "Enter text...",
}: SingleTextInputProps) {
  const [internalValue, setInternalValue] = useState("");

  // Use controlled value if provided, otherwise use internal state
  const currentValue = value !== undefined ? value : internalValue;

  const handleChange = (newValue: string) => {
    if (onChange) {
      onChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={currentValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-[45px] rounded-[10px] w-full border bg-neutral-700 px-4 outline-none",
          "placeholder:text-neutral-400 focus-within:outline-none! focus-within:ring-0!"
        )}
        style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}
      />
    </div>
  );
}
