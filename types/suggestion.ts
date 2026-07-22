import { Vote } from "./vote"
import { SOCIAL_TYPE } from "@/components/socials"

export type Suggestion = {
  id: string
  ip_id: string
  is_active: boolean
  account: string
  account_type?: SOCIAL_TYPE
  created_at: string
  updated_at: string
  votes: Vote[]
}
