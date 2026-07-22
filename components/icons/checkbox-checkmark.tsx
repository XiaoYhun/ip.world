export const CheckboxCheckmark = ({
  size = 10,
  color = "currentColor",
  className = "",
}: {
  size?: number
  color?: string
  className?: string
}) => {
  const width = size || 10
  const height = width * 0.8
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 10 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M9.20005 1.11243L3.42505 6.88743L0.800049 4.26243"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
