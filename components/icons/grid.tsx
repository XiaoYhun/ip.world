export const Grid = ({ size = 13 }: { size?: number }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 13 13" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 0H5.83333V5.83333H0V0ZM7.58333 0H7V5.83333H12.8333V0H7.58333ZM0 7H5.83333V12.8333H0V7ZM7.58333 7H7V12.8333H12.8333V7H7.58333Z"
        fill="currentcolor"
      />
    </svg>
  )
}
