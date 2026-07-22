"use client";

import { Close } from "@/components/icons/close";
import { Hyperlink } from "@/components/icons/hyperlink";
import { cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

interface UrlItem {
  id: string;
  url: string;
}

interface MultipleUrlsInputProps {
  value?: UrlItem[];
  onChange?: (urls: UrlItem[]) => void;
  placeholder?: string;
  label?: string;
}

export default function MultipleUrlsInput({
  value,
  onChange,
  placeholder = "https://example.com",
  label = "URL",
}: MultipleUrlsInputProps) {
  const [internalUrls, setInternalUrls] = useState<UrlItem[]>([]);

  // Use controlled value if provided, otherwise use internal state
  const urls = value !== undefined ? value : internalUrls;

  const updateUrls = (newUrls: UrlItem[]) => {
    if (onChange) {
      onChange(newUrls);
    } else {
      setInternalUrls(newUrls);
    }
  };

  const handleAddUrl = () => {
    const newUrl: UrlItem = {
      id: `url-${Date.now()}`,
      url: "",
    };
    updateUrls([...urls, newUrl]);
  };

  const handleDeleteUrl = (id: string) => {
    updateUrls(urls.filter((url) => url.id !== id));
  };

  const handleUrlChange = (id: string, newUrl: string) => {
    updateUrls(
      urls.map((url) =>
        url.id === id ? { ...url, url: newUrl } : url
      )
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {urls.map((urlItem) => {
        return (
          <div
            key={urlItem.id}
            className="flex items-center gap-3 relative"
          >
            <div className="flex-1 flex items-center gap-3 h-[45px] rounded-[10px] border bg-neutral-700 px-4" style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}>
              <input
                type="text"
                value={urlItem.url}
                onChange={(e) => handleUrlChange(urlItem.id, e.target.value)}
                placeholder={placeholder}
                className={cn(
                  "flex-1 bg-transparent outline-none text-sm",
                  "placeholder:text-neutral-400 focus-within:outline-none! focus-within:ring-0!"
                )}
              />
            </div>
            <button
              type="button"
              onClick={() => handleDeleteUrl(urlItem.id)}
              className="absolute cursor-pointer right-2 top-1.5 flex items-center justify-center w-8 h-8 rounded-lg hover:bg-neutral-700 transition-colors text-neutral-300 hover:text-white"
            >
              <Close size={12} />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={handleAddUrl}
        className="flex w-full cursor-pointer items-center justify-center gap-0.5 rounded-[10px] border-dashed border-neutral-500 border px-3 py-2! text-sm font-medium text-neutral-200 hover:border-neutral-300 transition-colors bg-transparent!"
        style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}
      >
        <PlusIcon size={16} />
      </button>
    </div>
  );
}
