"use client";

import { cn } from "@/lib/utils";
import { useVerificationForm } from "../form-context";

interface SingleSocialInputProps {
  placeholder?: string;
  icon?: React.ComponentType<{ size?: number }>;
  fieldName?: string;
}

export default function SingleSocialInput({
  placeholder = "@username",
  icon: Icon,
  fieldName,
}: SingleSocialInputProps) {
  const form = fieldName ? useVerificationForm() : null;
  const value = form && fieldName ? form.watch(fieldName as any) || "" : "";

  const handleChange = (newValue: string) => {
    if (form && fieldName) {
      form.setValue(fieldName as any, newValue, { shouldDirty: true });
    }
  };

  return (
    <div className="flex items-center gap-3 h-[45px] rounded-[10px] border bg-neutral-700 px-4" style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}>
      {Icon && <Icon size={20} />}
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "flex-1 bg-transparent outline-none text-sm",
          "placeholder:text-neutral-400 focus-within:outline-none! focus-within:ring-0!"
        )}
      />
    </div>
  );
}
