import CreateIpPageClient from "./CreateIpPageClient"

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function CreatePage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams

  const title = searchParams["title"] as string

  return <CreateIpPageClient title={title} />
}
