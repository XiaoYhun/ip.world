import { formatNumberWithHTMLSuperscript } from "@/lib/number"

interface SuperscriptNumberProps {
  value: number | string
  className?: string
  superscriptClassName?: string
}

export function SuperscriptNumber({
  value,
  className = "",
  superscriptClassName = "text-sm font-bold",
}: SuperscriptNumberProps) {
  const formattedValue = formatNumberWithHTMLSuperscript(value)

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{
        __html: formattedValue.replace(/<sup>/g, `<sup class="${superscriptClassName}">`),
      }}
    />
  )
}
