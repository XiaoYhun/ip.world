export const ThreeDots = ({ width = 16, height = 6 }: { width?: number; height?: number }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 16 6" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.66667 0.666992H0V5.33366H4.66667V0.666992ZM10.3333 0.666992H5.66667V5.33366H10.3333V0.666992ZM16 0.666992H11.3333V5.33366H16V0.666992Z"
        fill="currentColor"
      />
    </svg>
  )
}
