export const ChevronDown = ({ size = 20, className }: { size?: number; className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 16 12"
      fill="none"
      className={className}
    >
      <g clipPath="url(#clip0_1932_8270)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.9999 6.9478L14.0571 0.890632L15.9428 2.77624L7.9999 10.7191L0.0571289 2.77624L1.94275 0.890625L7.9999 6.9478Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_1932_8270">
          <rect width="16" height="11" fill="white" transform="translate(0 0.5)" />
        </clipPath>
      </defs>
    </svg>
  )
}
