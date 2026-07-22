import { z } from "zod"

//Note: IP creation requires at least one social link while social links are optional for token creation.

export const ip_schema = z
  .object({
    name: z.string().trim().min(1, "Please enter a name for your IP"),
    image: z.string().url("Please upload an image for your IP"),
    aliases: z.string().optional(),
    tags: z.string().optional(),
    description: z.string().trim().min(1, "Please enter a description for your IP"),
    twitter: z.string().optional(),
    tiktok: z.string().optional(),
    website: z.string().optional(),
    instagram: z.string().optional(),
  })
  .refine(
    (data) => {
      return !!(data.twitter || data.tiktok || data.website || data.instagram)
    },
    {
      message: "Please provide at least one social media link or website to your IP",
      path: ["social"],
    }
  )

export const token_schema = z.object({
  name: z.string().trim().min(1, "Please enter a name for your token"),
  symbol: z.string().min(1, "Please enter a ticker for your token."),
  description: z.string().min(1, "Please enter a description for your token."),
  tags: z.string().optional(),
  image: z.string().url("Please upload an image for your token"),
  anti_snipe: z.boolean().optional(),
  allocation: z.number().min(3, "Allocation must be at least 3%.").max(15, "Allocation must be at most 15%."),
  twitter: z.string().optional(),
})
