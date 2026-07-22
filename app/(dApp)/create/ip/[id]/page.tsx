import { env } from "@/config"
import { Ip } from "@/types/ip"
import CreateIpPageClient from "../CreateIpPageClient"

type Params = Promise<{ id: string }>

export const dynamic = "force-dynamic"
export const revalidate = 60
const CreateRemixTokenPage = async (props: { params: Promise<Params> }) => {
  const params = await props.params
  const id = params.id

  const ip = await getIp(id)

  if (!ip) {
    return <div>IP not found</div>
  }

  return <CreateIpPageClient ip={ip} />
}

const getIp = async (id: string): Promise<Ip | null> => {
  const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/ips/${id}`)

  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as Ip

  return data ?? null
}

export default CreateRemixTokenPage
