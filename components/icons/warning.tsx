export const Warning = ({ size = 12 }: { size?: number }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_1676_9994)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.0001 0L12.0002 6.0001L6.0001 12.0002L0 6.0001L6.0001 0ZM5.25 6.5V3H6.75V6.5H5.25ZM5.25 9V7.5H6.75V9H5.25Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_1676_9994">
          <rect width={size} height={size} fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
