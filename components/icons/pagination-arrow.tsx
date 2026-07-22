type Props = {
  size?: number
  direction?: "left" | "right"
}

export const PaginationArrow = ({ size = 16, direction = "left" }: Props) => {
  const style = direction === "right" ? { transform: "rotate(180deg)" } : undefined

  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <g clipPath="url(#clip0_pagination)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.07629 8L13.7048 0.37146L14.9619 1.62854L8.59045 8L14.9619 14.3715L13.7048 15.6285L6.07629 8Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M0.74292 8L8.37146 0.37146L9.62854 1.62854L3.25708 8L9.62854 14.3715L8.37146 15.6285L0.74292 8Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_pagination">
          <rect width="16" height="16" fill="white" transform="translate(0 16) rotate(-90)" />
        </clipPath>
      </defs>
    </svg>
  )
}

// Backwards compatibility exports
export const PaginationArrowLeft = (props: Omit<Props, "direction">) => <PaginationArrow {...props} direction="left" />

export const PaginationArrowRight = (props: Omit<Props, "direction">) => (
  <PaginationArrow {...props} direction="right" />
)
