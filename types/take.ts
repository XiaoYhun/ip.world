import { User } from "./user"

export type Take = {
  id: string
  ip_id: string
  author_address: string
  votes_count: number
  rating: number
  content: string
  created_at: string
  updated_at: string
  author: User
  author_take_count?: number
}
