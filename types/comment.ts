import { User } from "./user"

export type Comment = {
  id: string
  remix_id: string
  user_address: string
  body: string
  created_at: string
  updated_at: string
  user: User
  replies: Comment[]
}
