import { Ip } from "@/types/ip"
import { normalizeCategoryKey } from "@/lib/verification-criteria"
import AliasInput from "../inputs/AliasInput"
import SingleUrlInput from "../inputs/SingleUrlInput"
import SingleSocialInput from "../inputs/SingleSocialInput"
import AdditionalSocialsInput from "../inputs/AdditionalSocialsInput"
import MultipleSocialsInput from "../inputs/MultipleSocialsInput"
import MultipleUrlsInput from "../inputs/MultipleUrlsInput"
import SingleTextInput from "../inputs/SingleTextInput"
import RepeatableCreatorBlock from "../inputs/RepeatableCreatorBlock"
import { Twitter } from "@/components/icons/twitter"
import { Tiktok } from "@/components/icons/tiktok"
import { Website } from "@/components/icons/website"
import { Telegram } from "@/components/icons/telegram"
import { useMemo, ReactNode } from "react"

const titleCase = (s: string) =>
  s
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")

/* ─── helpers ─── */
interface FieldDef {
  key: string
  label: string
  description: string
  render: () => ReactNode
}

/* ─── category-specific fields (between the general fields and "Additional Links") ─── */
function getCategoryFields(category: string, categoryName: string): FieldDef[] {
  switch (category) {
    case "pet":
      return [
        {
          key: "pet-owner-social",
          label: "Pet Owner",
          description: `Social accounts of the person or entity owning the ${categoryName}`,
          render: () => <MultipleSocialsInput platforms={["twitter", "tiktok", "instagram", "facebook"]} />,
        },
      ]

    case "person":
      return []

    case "trend":
      return [
        {
          key: "originating-posts",
          label: "Originating Posts",
          description: "First or most notable posts tied to the trend",
          render: () => <MultipleUrlsInput />,
        },
        {
          key: "original-creator-social",
          label: "Original Creator",
          description: "Social account of the main person recognized for starting the trend",
          render: () => <MultipleSocialsInput platforms={["twitter", "tiktok", "instagram", "facebook"]} />,
        },
        {
          key: "other-creators",
          label: "Other Creators",
          description: "Social accounts of additional creators who helped start the trend",
          render: () => (
            <RepeatableCreatorBlock
              platforms={["twitter", "tiktok", "instagram", "facebook"]}
              namePlaceholder="Creator name"
            />
          ),
        },
      ]

    case "game":
      return [
        {
          key: "github",
          label: "GitHub",
          description: "GitHub link associated with the game",
          render: () => <SingleUrlInput placeholder="https://github.com/username/repo" />,
        },
        {
          key: "author-social",
          label: "Author",
          description: `Social accounts of the entity or developer who built the ${categoryName}`,
          render: () => <MultipleSocialsInput platforms={["twitter", "github"]} />,
        },
        {
          key: "additional-authors",
          label: "Additional Authors",
          description: "Additional contributors behind the game",
          render: () => (
            <RepeatableCreatorBlock platforms={["twitter", "github", "instagram"]} namePlaceholder="Author name" />
          ),
        },
        {
          key: "gameplay-links",
          label: "Gameplay Links",
          description: "Playable demos, trailers, or gameplay clips",
          render: () => <MultipleUrlsInput />,
        },
        {
          key: "community-links",
          label: "Community Links",
          description: "Game community hubs (X, Discord, Reddit, etc.)",
          render: () => <MultipleSocialsInput platforms={["twitter", "discord", "reddit"]} />,
        },
      ]

    case "technology":
      return [
        {
          key: "github",
          label: "GitHub",
          description: "GitHub link associated with the technology",
          render: () => <SingleUrlInput placeholder="https://github.com/username/repo" />,
        },
        {
          key: "author-social",
          label: "Author",
          description: "Social accounts of the main creator or company behind the technology",
          render: () => <MultipleSocialsInput platforms={["twitter", "github", "instagram"]} />,
        },
        {
          key: "additional-authors",
          label: "Additional Authors",
          description: "Additional contributors behind the technology",
          render: () => (
            <RepeatableCreatorBlock platforms={["twitter", "github", "instagram"]} namePlaceholder="Author name" />
          ),
        },
        {
          key: "product-links",
          label: "Product Links",
          description: "Links to the main product or demo material",
          render: () => <MultipleUrlsInput />,
        },
        {
          key: "technical-docs",
          label: "Technical Docs",
          description: "Documentation around the product",
          render: () => <SingleUrlInput placeholder="https://docs.example.com" />,
        },
      ]

    case "meme":
      return [
        {
          key: "originating-posts",
          label: "Originating Posts",
          description: "Earliest or most notable posts around the meme",
          render: () => <MultipleUrlsInput />,
        },
        {
          key: "original-creator-social",
          label: "Original Creator",
          description: "Social account of the main person recognized for creating the meme",
          render: () => <MultipleSocialsInput platforms={["twitter", "tiktok", "instagram", "facebook"]} />,
        },
      ]

    case "movement":
      return [
        {
          key: "organizer-social",
          label: "Organizer",
          description: "Social accounts of the main organizer behind this movement",
          render: () => <MultipleSocialsInput platforms={["twitter", "tiktok", "instagram", "facebook"]} />,
        },
        {
          key: "co-organizers",
          label: "Co-organizer",
          description: "Social accounts of additional organizers or leaders",
          render: () => (
            <RepeatableCreatorBlock
              platforms={["twitter", "tiktok", "instagram", "facebook"]}
              namePlaceholder="Organizer name"
            />
          ),
        },
      ]

    case "brand":
      return [
        {
          key: "founder-social",
          label: "Founder",
          description: "Social accounts of the founder of the brand",
          render: () => <MultipleSocialsInput platforms={["twitter", "tiktok", "instagram", "facebook"]} />,
        },
        {
          key: "additional-founders",
          label: "Additional Founders",
          description: "Social accounts of additional founders behind the brand",
          render: () => (
            <RepeatableCreatorBlock
              platforms={["twitter", "tiktok", "instagram", "facebook"]}
              namePlaceholder="Founder name"
            />
          ),
        },
        {
          key: "registered-entity",
          label: "Registered Entity",
          description: "Legal company name (if applicable)",
          render: () => <SingleTextInput placeholder="Legal company name (if applicable)" />,
        },
      ]

    case "character":
      return [
        {
          key: "creator-social",
          label: "Creator",
          description: "Social accounts of the creator behind the character",
          render: () => <MultipleSocialsInput platforms={["twitter", "tiktok", "instagram", "facebook"]} />,
        },
        {
          key: "merchandising-links",
          label: "Merchandising",
          description: "Links to merchandising or licensing websites",
          render: () => <MultipleUrlsInput />,
        },
      ]

    case "art":
      return [
        {
          key: "artist-social",
          label: "Artist",
          description: "Social account of the artist",
          render: () => <MultipleSocialsInput platforms={["twitter", "tiktok", "instagram", "facebook"]} />,
        },
        {
          key: "artist-website",
          label: "Artist Website",
          description: "Official artist website",
          render: () => <SingleUrlInput placeholder="https://artist-website.com" />,
        },
        {
          key: "links-to-art",
          label: "Links to Art",
          description: "Pages showcasing the artist's work (galleries, exhibitions, etc.)",
          render: () => <MultipleUrlsInput />,
        },
      ]

    case "misc":
    default:
      return [
        {
          key: "primary-creator-social",
          label: "Primary Creator",
          description: "Social accounts of main community or person behind this entity",
          render: () => <MultipleSocialsInput platforms={["twitter", "tiktok", "instagram", "facebook"]} />,
        },
      ]
  }
}

/* ─── component ─── */
export default function IPInformationLinkSupportScreen({ ip }: { ip: Ip }) {
  const categoryKey = normalizeCategoryKey(ip.category)
  const categoryName = categoryKey === "misc" ? "entity" : categoryKey
  const ipName = titleCase(ip.title)
  const isCreatorToken = ip.type === "creator"
  const categoryFields = useMemo(() => getCategoryFields(categoryKey, categoryName), [categoryKey, categoryName])

  return (
    <div className="max-h-[540px] min-h-[540px] overflow-y-auto rounded-[16px] border bg-neutral-800 p-6">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="mb-2">
          <div className="font-archivo mb-2 text-[24px] font-medium">Supporting Information</div>
          <div className="font-archivo text-sm text-neutral-100">
            Please provide any additional metadata or links to help us process verification.
          </div>
        </div>

        {/* ── Aliases (all types) ── */}
        <Field
          label="Aliases"
          description={`Other names, nicknames, or variations this ${categoryName} may be known by`}
        >
          <AliasInput />
        </Field>

        {/* ── Type-specific general fields ── */}
        {isCreatorToken ? (
          <>
            <Field label="Official Website" description={`Official website for this ${categoryName}`}>
              <SingleUrlInput placeholder="https://example.com" icon={Website} fieldName="creator_official_website" />
            </Field>
            <Field label="X" description={`Primary X account associated with this ${categoryName}`}>
              <SingleSocialInput placeholder="@username" icon={Twitter} fieldName="creator_x_account" />
            </Field>
            <Field label="TikTok" description={`Primary TikTok account associated with this ${categoryName}`}>
              <SingleSocialInput placeholder="@username" icon={Tiktok} fieldName="creator_tiktok_account" />
            </Field>
            <Field
              label="Additional Social Links"
              description={`Add additional social media accounts for this ${categoryName}`}
            >
              <AdditionalSocialsInput
                platforms={["instagram", "youtube", "facebook", "linkedin"]}
                fieldName="creator_additional_socials"
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="X" description="Main X account representing this token community">
              <SingleSocialInput placeholder="@username" icon={Twitter} fieldName="community_x_account" />
            </Field>
            <Field label="Website" description="Primary website for this token">
              <SingleUrlInput placeholder="https://example.com" icon={Website} fieldName="community_website" />
            </Field>
            <Field label="X Community" description="Official X community link for the token">
              <SingleUrlInput
                placeholder="https://x.com/i/communities/..."
                icon={Twitter}
                fieldName="community_x_community"
              />
            </Field>
            <Field label="Telegram" description="Main telegram group for the token">
              <SingleSocialInput placeholder="t.me/groupname" icon={Telegram} fieldName="community_telegram" />
            </Field>
            <Field
              label="Additional Social Links"
              description="Add additional social media accounts for this token"
            >
              <AdditionalSocialsInput
                platforms={["tiktok", "youtube", "facebook", "linkedin", "instagram"]}
                fieldName="community_additional_socials"
              />
            </Field>
          </>
        )}

        {/* ── Category-specific fields ── */}
        {categoryFields.map((field) => (
          <Field
            key={field.key}
            label={field.label}
            description={field.description}
          >
            {field.render()}
          </Field>
        ))}

        {/* ── Additional Links (all categories) ── */}
        <Field
          label="Additional Links"
          description="Media coverage, articles, features, or other relevant pages"
        >
          <MultipleUrlsInput />
        </Field>
      </div>
    </div>
  )
}

/* ─── reusable field wrapper ─── */
function Field({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: ReactNode
}) {
  return (
    <div>
      <div className="font-archivo mb-0.5 text-sm font-semibold text-neutral-100">
        {label}
      </div>
      <div className="font-archivo mb-3 text-xs text-neutral-200">{description}</div>
      {children}
    </div>
  )
}
