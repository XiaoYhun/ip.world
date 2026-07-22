import { Loader2 } from "lucide-react"

const Spinner = ({ size = 40 }: { size?: number }) => {
  return (
    <div role="status">
      <Loader2 size={size} className="animate-spin" />
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export default Spinner
