"use client";

import { Close } from "@/components/icons/close";
import { Facebook } from "@/components/icons/facebook";
import { Instagram } from "@/components/icons/instagram";
import { Tiktok } from "@/components/icons/tiktok";
import { Youtube } from "@/components/icons/youtube";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useVerificationForm } from "../form-context";

type SocialPlatform = "instagram" | "youtube" | "facebook" | "linkedin" | "tiktok";

interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  username: string;
}

export interface SocialPlatformOption {
  key: SocialPlatform;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  placeholder?: string;
}

const LinkedIn = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

const ALL_SOCIAL_PLATFORMS: Record<SocialPlatform, SocialPlatformOption> = {
  instagram: {
    key: "instagram",
    label: "Instagram",
    icon: Instagram,
    placeholder: "@username",
  },
  youtube: {
    key: "youtube",
    label: "YouTube",
    icon: Youtube,
    placeholder: "youtube.com/@channel",
  },
  facebook: {
    key: "facebook",
    label: "Facebook",
    icon: Facebook,
    placeholder: "facebook.com/username",
  },
  linkedin: {
    key: "linkedin",
    label: "LinkedIn",
    icon: LinkedIn,
    placeholder: "linkedin.com/in/username",
  },
  tiktok: {
    key: "tiktok",
    label: "TikTok",
    icon: Tiktok,
    placeholder: "@username",
  },
};

interface AdditionalSocialsInputProps {
  platforms?: SocialPlatform[];
  fieldName?: string;
}

export default function AdditionalSocialsInput({
  platforms = ["instagram", "youtube", "facebook", "linkedin"],
  fieldName,
}: AdditionalSocialsInputProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const form = fieldName ? useVerificationForm() : null;
  
  // Filter available platforms based on the platforms prop
  const availablePlatforms = platforms
    .map(key => ALL_SOCIAL_PLATFORMS[key])
    .filter(Boolean);

  // Get accounts from form or use empty array
  const accounts: SocialAccount[] = (form && fieldName ? form.watch(fieldName as any) : []) || [];

  const updateAccounts = (newAccounts: SocialAccount[]) => {
    if (form && fieldName) {
      form.setValue(fieldName as any, newAccounts, { shouldDirty: true });
    }
  };

  const handleAddPlatform = (platform: SocialPlatform) => {
    const newAccount: SocialAccount = {
      id: `${platform}-${Date.now()}`,
      platform,
      username: "",
    };
    updateAccounts([...accounts, newAccount]);
    setIsDropdownOpen(false);
  };

  const handleDeleteAccount = (id: string) => {
    updateAccounts(accounts.filter((account) => account.id !== id));
  };

  const handleUsernameChange = (id: string, username: string) => {
    updateAccounts(
      accounts.map((account) =>
        account.id === id ? { ...account, username } : account
      )
    );
  };

  const getPlatformInfo = (platform: SocialPlatform) => {
    return ALL_SOCIAL_PLATFORMS[platform];
  };

  // Get platforms that haven't been added yet
  const unusedPlatforms = availablePlatforms.filter(
    (platform) => !accounts.some((account) => account.platform === platform.key)
  );

  return (
    <div className="flex flex-col gap-3">
      {accounts.map((account) => {
        const platformInfo = getPlatformInfo(account.platform);
        const Icon = platformInfo?.icon;

        return (
          <div
            key={account.id}
            className="flex items-center gap-3 relative"
          >
            <div className="flex-1 flex items-center gap-3 h-[45px] rounded-[10px] border bg-neutral-700 px-4" style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}>
              {Icon && <Icon size={20} />}
              <input
                type="text"
                value={account.username}
                onChange={(e) => handleUsernameChange(account.id, e.target.value)}
                placeholder={platformInfo?.placeholder || "@username"}
                className={cn(
                  "flex-1 bg-transparent outline-none text-sm",
                  "placeholder:text-neutral-400 focus-within:outline-none! focus-within:ring-0!"
                )}
              />
            </div>
            <button
              type="button"
              onClick={() => handleDeleteAccount(account.id)}
              className="absolute cursor-pointer right-2 top-1.5 flex items-center justify-center w-8 h-8 rounded-lg hover:bg-neutral-700 transition-colors text-neutral-300 hover:text-white"
            >
              <Close size={12} />
            </button>
          </div>
        );
      })}

      {unusedPlatforms.length > 0 && (
        <Select open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <SelectTrigger
            className="h-[45px] flex w-full cursor-pointer items-center justify-center gap-0.5 rounded-[10px] border-dashed border-neutral-500 border px-3 py-3 text-sm font-medium text-neutral-100 hover:border-neutral-300 transition-colors bg-transparent!"
            style={{ boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.20)" }}
            noArrow
          >
            <span className="text-2xl leading-none"><PlusIcon size={20} /></span>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {unusedPlatforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <SelectItem
                    value={platform.key}
                    key={platform.key}
                    onPointerDown={() => handleAddPlatform(platform.key)}
                  >
                    <div className="flex cursor-pointer items-center gap-2">
                      <Icon size={16} />
                      {platform.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
