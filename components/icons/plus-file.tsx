export const PlusFile = ({ size = 10 }: { size?: number }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_4331_10088)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M9.58268 0.416504H0.416016V9.58317H7.25527L9.58268 7.25575V0.416504Z"
          fill="url(#paint0_linear_4331_10088)"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4.37435 5.62484V7.08317H5.62435V5.62484H7.08268V4.37484H5.62435V2.9165H4.37435V4.37484H2.91602V5.62484H4.37435Z"
          fill="black"
        />
      </g>
      <defs>
        <linearGradient
          id="paint0_linear_4331_10088"
          x1="4.99935"
          y1="9.58317"
          x2="206"
          y2="9.99965"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#73EFC1" />
          <stop offset="0.5" stopColor="#944AFF" />
          <stop offset="1" stopColor="#F77EFF" />
        </linearGradient>
        <clipPath id="clip0_4331_10088">
          <rect width="10" height="10" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
