"use client";

import { Close } from "@/components/icons/close";
import { cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import MultipleSocialsInput from "./MultipleSocialsInput";

interface Creator {
  id: string;
  name: string;
  socials: any[];
}

interface RepeatableCreatorBlockProps {
  value?: Creator[];
  onChange?: (creators: Creator[]) => void;
  platforms?: string[];
  nameLabel?: string;
  namePlaceholder?: string;
}

export default function RepeatableCreatorBlock({
  value,
  onChange,
  platforms,
  nameLabel = "Name",
  namePlaceholder = "Enter name...",
}: RepeatableCreatorBlockProps) {
  const [internalCreators, setInternalCreators] = useState<Creator[]>([]);

  const creators = value !== undefined ? value : internalCreators;

  const updateCreators = (newCreators: Creator[]) => {
    if (onChange) {
      onChange(newCreators);
    } else {
      setInternalCreators(newCreators);
    }
  };

  const handleAddCreator = () => {
    const newCreator: Creator = {
      id: `creator-${Date.now()}`,
      name: "",
      socials: [],
    };
    updateCreators([...creators, newCreator]);
  };

  const handleDeleteCreator = (id: string) => {
    updateCreators(creators.filter((creator) => creator.id !== id));
  };

  const handleNameChange = (id: string, name: string) => {
    updateCreators(
      creators.map((creator) =>
        creator.id === id ? { ...creator, name } : creator
      )
    );
  };

  const handleSocialsChange = (id: string, socials: any[]) => {
    updateCreators(
      creators.map((creator) =>
        creator.id === id ? { ...creator, socials } : creator
      )
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {creators.map((creator) => (
        <div
          key={creator.id}
          className="rounded-[12px] border border-neutral-500 bg-neutral-750 p-4 relative"
        >
          <button
            type="button"
            onClick={() => handleDeleteCreator(creator.id)}
            className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 rounded-lg transition-colors text-neutral-300 hover:text-white cursor-pointer"
          >
            <Close size={12} />
          </button>

          <div className="mb-4">
            <div className="text-sm font-semibold font-archivo text-neutral-100 mb-2">
              {nameLabel}
            </div>
            <input
              type="text"
              value={creator.name}
              onChange={(e) => handleNameChange(creator.id, e.target.value)}
              placeholder={namePlaceholder}
              className={cn(
                "h-[45px] rounded-[10px] w-full border bg-neutral-700 px-4 outline-none",
                "placeholder:text-neutral-400 focus-within:outline-none! focus-within:ring-0!"
              )}
              style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}
            />
          </div>

          <div>
            <div className="text-sm font-semibold font-archivo text-neutral-100 mb-2">
              Social Links
            </div>
            <MultipleSocialsInput
              platforms={platforms as any[]}
              value={creator.socials}
              onChange={(socials) => handleSocialsChange(creator.id, socials)}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAddCreator}
        className="flex w-full cursor-pointer items-center justify-center gap-0.5 rounded-[10px] border-dashed border-neutral-500 border px-3 py-2! text-sm font-medium text-neutral-200 hover:border-neutral-300 transition-colors bg-transparent!"
        style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}
      >
        <PlusIcon size={16} />
      </button>
    </div>
  );
}
