export type SearchParamsInput = { [key: string]: string | string[] | undefined }

export function buildHomepageRemixesQuery(urlParams?: SearchParamsInput) {
  const sortBy = (urlParams?.sort_by as string) || "trending_score_24h"
  const sortOrder = (urlParams?.sort_order as string) || "desc"
  const category = urlParams?.category as string | undefined
  const verified = urlParams?.verified as string | undefined
  const hideSpam = urlParams?.hide_spam as string | undefined
  const isGraduated = urlParams?.is_graduated as string | undefined

  const params = new URLSearchParams()
  params.set("sort_by", sortBy)
  params.set("sort_order", sortOrder)
  params.set("limit", "20")
  if (category) params.set("category", category)
  if (verified === "true") params.set("verified", "true")
  if (hideSpam === "false") params.set("hide_spam", "false")
  if (isGraduated !== undefined) params.set("is_graduated", isGraduated)

  return params
}
