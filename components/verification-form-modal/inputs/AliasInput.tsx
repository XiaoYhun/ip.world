import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Close } from "@/components/icons";
import { motion } from "framer-motion";
import { useVerificationForm } from "../form-context";

export default function AliasInput() {
  const form = useVerificationForm();
  const formAliases = form.watch("aliases") || [];
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addAlias = (value: string) => {
    const v = value.trim();
    if (!v || formAliases.includes(v)) { setInput(""); return; }
    form.setValue("aliases", [...formAliases, v], { shouldDirty: true });
    setInput("");
  };

  const removeAlias = (index: number) => {
    form.setValue("aliases", formAliases.filter((_, i) => i !== index), { shouldDirty: true });
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className={cn(
        "flex min-h-[44px] w-full flex-wrap items-center gap-2 relative",
        "rounded-[12px] border bg-neutral-700 px-4 py-3",
        "border-neutral-500 cursor-text"
      )}
      style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}
    >
      {formAliases.map((alias, index) => (
        <motion.div
          layout="size"
          key={alias + index}
          transition={{
            layout: {
              duration: 0.25,
              ease: "easeOut",
            },
          }}
          className="inline-flex rounded-[8px] bg-neutral-500 px-1.5 py-2 leading-[10px] text-white text-sm
             group items-center gap-2 cursor-default z-10"
        >
          <span className="whitespace-nowrap">{alias}</span>

          <div
            className="hidden group-hover:block text-neutral-300 hover:text-neutral-100 cursor-pointer"
            onClick={() => removeAlias(index)}
          >
            <Close size={10} />
          </div>
        </motion.div>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === "Tab") && input) {
            e.preventDefault();
            addAlias(input);
          }

          if (e.key === "Backspace" && !input && formAliases.length) {
            form.setValue("aliases", formAliases.slice(0, -1), { shouldDirty: true });
          }
        }}
        placeholder="Aliases"
        className={cn(
          "flex-1 min-w-[120px] bg-transparent outline-none focus-within:outline-none! focus-within:ring-0!",
          "text-neutral-100 placeholder:text-neutral-400 z-5"
        )}
      />
      <div className="absolute right-2 font-mono text-neutral-400 text-xs top-0 bottom-0 flex items-center justify-center text-nowrap z-0">
        → Tab to complete
      </div>
    </div>
  );
}
