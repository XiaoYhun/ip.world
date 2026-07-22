export const Pencil = ({ size = 12 }: { size: number }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 12 12" fill="none">
      <g clipPath="url(#clip0_3198_1430)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.7501 0.0429688L11.9572 4.25008L10.4571 5.75012L6.25 1.54299L7.7501 0.0429688ZM5.54285 2.2501L0.5 7.29297V11.5001H4.70711L9.75 6.45722L5.54285 2.2501Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_3198_1430">
          <rect width={size} height={size} fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
