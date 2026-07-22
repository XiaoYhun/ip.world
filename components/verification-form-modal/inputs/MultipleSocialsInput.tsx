"use client";

import { Close } from "@/components/icons/close";
import { Discord } from "@/components/icons/discord";
import { Facebook } from "@/components/icons/facebook";
import { Instagram } from "@/components/icons/instagram";
import { Tiktok } from "@/components/icons/tiktok";
import { Twitter } from "@/components/icons/twitter";
import { Website } from "@/components/icons/website";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

type SocialPlatform = "twitter" | "tiktok" | "instagram" | "facebook" | "website" | "github" | "discord" | "reddit";

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

const GitHubIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const RedditIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.88-7.004 4.88-3.874 0-7.004-2.186-7.004-4.88 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
  </svg>
);

const ALL_SOCIAL_PLATFORMS: SocialPlatformOption[] = [
  {
    key: "twitter",
    label: "X / Twitter",
    icon: Twitter,
    placeholder: "@username",
  },
  {
    key: "tiktok",
    label: "TikTok",
    icon: Tiktok,
    placeholder: "@username",
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: Instagram,
    placeholder: "@username",
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: Facebook,
    placeholder: "facebook.com/username",
  },
  {
    key: "website",
    label: "Website",
    icon: Website,
    placeholder: "https://example.com",
  },
  {
    key: "github",
    label: "GitHub",
    icon: GitHubIcon,
    placeholder: "github.com/username",
  },
  {
    key: "discord",
    label: "Discord",
    icon: Discord,
    placeholder: "discord.gg/... or username",
  },
  {
    key: "reddit",
    label: "Reddit",
    icon: RedditIcon,
    placeholder: "reddit.com/u/username",
  },
];

interface MultipleSocialsInputProps {
  platforms?: SocialPlatform[];
  value?: SocialAccount[];
  onChange?: (accounts: SocialAccount[]) => void;
}

export default function MultipleSocialsInput({
  platforms,
  value,
  onChange,
}: MultipleSocialsInputProps) {
  const [internalAccounts, setInternalAccounts] = useState<SocialAccount[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filter available platforms based on the platforms prop
  const availablePlatforms = platforms
    ? ALL_SOCIAL_PLATFORMS.filter(p => platforms.includes(p.key))
    : ALL_SOCIAL_PLATFORMS;

  // Use controlled value if provided, otherwise use internal state
  const accounts = value !== undefined ? value : internalAccounts;

  const updateAccounts = (newAccounts: SocialAccount[]) => {
    if (onChange) {
      onChange(newAccounts);
    } else {
      setInternalAccounts(newAccounts);
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
    return ALL_SOCIAL_PLATFORMS.find((p) => p.key === platform);
  };

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
            {availablePlatforms.map((platform) => {
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
    </div>
  );
}