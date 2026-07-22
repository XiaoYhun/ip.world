import { useState } from "react"

const MAX_LENGTH = 100

const RemixDescription = ({ text }: { text: string }) => {
  const [showMore, setShowMore] = useState(false)

  if (text.length <= MAX_LENGTH) {
    return <>{text}</>
  }

  return (
    <>
      {showMore ? text : <>{text.slice(0, MAX_LENGTH)}...</>}
      {text.length > MAX_LENGTH && (
        <span
          className="text-brand hover:text-brand-secondary ml-1 cursor-pointer text-sm"
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? "see less" : "see more"}
        </span>
      )}
    </>
  )
}

export default RemixDescription
