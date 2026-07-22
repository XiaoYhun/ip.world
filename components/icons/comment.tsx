export const Comment = ({ size = 14 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 14 14"
    fill="none"
  >
    <g clipPath="url(#clip0_2828_13708)">
      <mask
        id="mask0_2828_13708"
        style={{ maskType: "luminance" }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="14"
        height="14"
      >
        <path d="M0 0H14V14H0V0Z" fill="white" />
      </mask>
      <g mask="url(#mask0_2828_13708)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.58333 1.16699C4.11439 1.16699 1.16668 3.70321 1.16668 7.00033C1.16668 8.07675 1.50699 9.09041 2.04753 9.96121L0.170875 11.8379C0.00404064 12.0047 -0.0458686 12.2556 0.0444198 12.4736C0.134708 12.6916 0.347413 12.8337 0.583351 12.8337H7.58333C11.0523 12.8337 14 10.2974 14 7.00033C14 3.70321 11.0523 1.16699 7.58333 1.16699ZM8.75 5.83366H4.66667V4.66699H8.75V5.83366ZM4.66667 8.75033H10.5V7.58366H4.66667V8.75033Z"
          fill="currentColor"
        />
      </g>
    </g>
    <defs>
      <clipPath id="clip0_2828_13708">
        <rect width="14" height="14" fill="white" />
      </clipPath>
    </defs>
  </svg>
)

