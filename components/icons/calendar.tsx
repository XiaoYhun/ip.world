export const Calendar = ({ size = 24 }: { size?: number }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.75 3.25H7.25V1H4.75V3.25H0.75V23.75H23.25V3.25H19.25V1H16.75V3.25ZM3.25 9.5V21.25H20.75V9.5H3.25ZM5.5 12H10.5V17H5.5V12Z"
        fill="currentColor"
      />
    </svg>
  )
}
