export const StarUnchecked = ({ size = 20 }: { size?: number }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <g clipPath="url(#clip0_1477_2302)">
        <path
          d="M15.5 8L12 2L8.5 8L2 10L6.5 14.5L5 22L12 18.8421L19 22L17.5 14.5L22 10L15.5 8Z"
          stroke="currentColor"
          strokeWidth="2"
        />
      </g>
      <defs>
        <clipPath id="clip0_1477_2302">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
