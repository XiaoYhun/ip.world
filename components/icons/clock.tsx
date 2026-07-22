export const Clock = ({ size = 12 }: { size?: number }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_1926_1130)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1.75736 2.65384C2.88258 1.52862 4.4087 0.896484 6 0.896484C7.5913 0.896484 9.1174 1.52862 10.2427 2.65384C11.3679 3.77906 12 5.30518 12 6.89648C12 8.48778 11.3679 10.0139 10.2427 11.1391C9.1174 12.2643 7.5913 12.8965 6 12.8965C4.4087 12.8965 2.88258 12.2643 1.75736 11.1391C0.63214 10.0139 0 8.48778 0 6.89648C0 5.30518 0.63214 3.77906 1.75736 2.65384ZM5.5 3.39648V7.39648H8.5V6.39648H6.5V3.39648H5.5Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_1926_1130">
          <rect width="12" height="12" fill="currentColor" transform="translate(0 0.896484)" />
        </clipPath>
      </defs>
    </svg>
  )
}
