export const Transaction = ({ size = 14 }: { size?: number }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 12 13" fill="none">
      <g clipPath="url(#clip0_2683_9253)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M9.81228 3.18973L7.93067 1.30812L8.7388 0.5L12 3.7612L8.7388 7.02241L7.93067 6.21429L9.81237 4.33259H1.19182V3.18973H9.81228ZM2.2857 9.47545H10.9062V8.33259H2.28579L4.1674 6.45098L3.35928 5.64286L0.098074 8.90406L3.35928 12.1653L4.1674 11.3571L2.2857 9.47545Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_2683_9253">
          <rect width="12" height="12" fill="white" transform="translate(0 0.5)" />
        </clipPath>
      </defs>
    </svg>
  )
}
