import { ReactNode } from "react"
import useDimensions from "@/hooks/use-dimensions"

interface IProps {
  header: ReactNode
  content: ReactNode
  showContent: boolean
  onHeaderClick: () => void
}

const AccordionItem = ({ header, content, showContent, onHeaderClick }: IProps) => {
  const { ref: contentRef, scrollHeight } = useDimensions<HTMLDivElement>()
  return (
    <div>
      <div className="w-full" onClick={onHeaderClick}>
        {header}
      </div>
      <div className="overflow-hidden transition-all duration-500" style={{ height: showContent ? scrollHeight : 0 }}>
        <div ref={contentRef}>{content}</div>
      </div>
    </div>
  )
}

export default AccordionItem
