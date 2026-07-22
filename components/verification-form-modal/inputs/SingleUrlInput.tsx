"use client";

import { cn } from "@/lib/utils";
import { useVerificationForm } from "../form-context";

interface SingleUrlInputProps {
  placeholder?: string;
  icon?: React.ComponentType<{ size?: number }>;
  fieldName?: string;
}

export default function SingleUrlInput({
  placeholder = "https://example.com",
  icon: Icon,
  fieldName,
}: SingleUrlInputProps) {
  const form = fieldName ? useVerificationForm() : null;
  const value = form && fieldName ? form.watch(fieldName as any) || "" : "";

  const handleChange = (newValue: string) => {
    if (form && fieldName) {
      form.setValue(fieldName as any, newValue, { shouldDirty: true });
    }
  };

  return (
    <div className={cn(
      "flex items-center h-[45px] rounded-[10px] w-full border bg-neutral-700 outline-none",
      Icon ? "gap-3 px-4" : "px-0"
    )}
    style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}>
      {Icon && <Icon size={20} />}
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "flex-1 bg-transparent outline-none text-sm",
          "placeholder:text-neutral-400 focus-within:outline-none! focus-within:ring-0!",
          !Icon && "px-4"
        )}
      />
    </div>
  );
}
