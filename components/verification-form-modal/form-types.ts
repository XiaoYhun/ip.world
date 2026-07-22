// Flat form structure for verification form
export interface VerificationFormData {
  // Identity fields (creator token: creator | representative; community token: community_lead | community_member)
  identity_role: "creator" | "representative" | "community_lead" | "community_member"
  identity_company_name?: string
  identity_your_role?: string
  identity_name_pseudonym: string
  identity_email: string
  identity_telegram: string
  identity_fund_management_address: string
  identity_use_my_account?: boolean // Creator only: use connected wallet for payout (default true)
  identity_referral_code?: string // Creator only: referral code of person who referred you
  identity_referral_address?: string // Resolved wallet address of referrer (set by validation)

  // Official token (the IP's default remix token)
  official_token_address?: string
  
  // IP Information & Reasoning
  ip_description_reasoning: string
  
  // Links & Supporting Information - General
  aliases: string[]
  contact_email: string
  contact_relationship: string
  media_coverage_links: string[]
  
  // Type-specific fields (creator vs community)
  // Creator token fields
  creator_official_website?: string
  creator_x_account?: string
  creator_tiktok_account?: string
  creator_additional_socials?: Array<{ platform: string; username: string }>
  
  // Community token fields
  community_x_account?: string
  community_website?: string
  community_x_community?: string
  community_telegram?: string
  community_additional_socials?: Array<{ platform: string; username: string }>
  
  // Links & Supporting Information - Category Specific (dynamic based on IP category)
  // Single property per category containing all related data
  pet_data?: Record<string, string | string[]>
  person_data?: Record<string, string | string[]>
  trend_data?: Record<string, string | string[] | Array<{ name: string; socials: Record<string, string> }>>
  tech_data?: Record<string, string | string[] | Array<{ name: string; socials: Record<string, string> }>>
  meme_data?: Record<string, string | string[]>
  movement_data?: Record<string, string | string[] | Array<{ name: string; socials: Record<string, string> }>>
  brand_data?: Record<string, string | string[] | Array<{ name: string; socials: Record<string, string> }>>
  art_data?: Record<string, string | string[]>
  game_data?: Record<string, string | string[]>
  character_data?: Record<string, string | string[]>
  agent_data?: Record<string, string | string[]>
  misc_data?: Record<string, string | string[] | Array<{ name: string; socials: Record<string, string> }>>
  
  // Alternative: Use a single dynamic property for all categories
  // category_specific_data?: Record<string, string | string[] | Array<{ name: string; socials: Record<string, string> }>>
  
  // Rights & Verification
  verification_methods: ("social" | "ip-rights")[]
  selected_rights: string[]
  
  // Social connections (would be handled separately in real implementation)
  connected_twitter?: boolean
  connected_tiktok?: boolean
  
  // Files (handled separately from form_data in the API call)
  uploaded_documents?: File[]
  
  // Terms & Conditions
  terms_launchpad_agreed?: boolean
  terms_pil_agreed?: boolean
}

export const DEFAULT_FORM_VALUES: Partial<VerificationFormData> = {
  identity_role: "creator",
  identity_use_my_account: true,
  aliases: [],
  media_coverage_links: [],
  verification_methods: [],
  selected_rights: [],
  uploaded_documents: [],
  terms_launchpad_agreed: false,
  terms_pil_agreed: false,
  creator_additional_socials: [],
  community_additional_socials: [],
  official_token_address: "",
}
