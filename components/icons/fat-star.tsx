export const FatStar = ({ size = 10 }: { size?: number }) => {
  return (
    <svg width={size} height={size + 1} viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_6457_480)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.73634 3.48282L5.00005 0.50631L3.26373 3.48282L0.0493927 4.47185L2.25606 6.6785L1.51582 10.3797L5.00005 8.80788L8.48425 10.3797L7.744 6.6785L9.95067 4.47185L6.73634 3.48282Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_6457_480">
          <rect width="10" height="10" fill="white" transform="translate(0 0.5)" />
        </clipPath>
      </defs>
    </svg>
  )
}
