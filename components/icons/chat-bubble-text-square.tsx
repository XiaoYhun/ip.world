export const ChatBubbleTextSquare = ({ size = 14 }: { size?: number }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path
        d="M1.16667 1.16667H12.8333V10.5H6.125L3.79167 11.9583L2.33333 12.8333V10.5H1.16667V1.16667Z"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <path d="M3.5 4.66667H10.5" stroke="currentColor" strokeWidth="1" />
      <path d="M3.5 7H8.16667" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}