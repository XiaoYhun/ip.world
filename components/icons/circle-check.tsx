export const CircleCheck = ({ size = 16 }: { size?: number }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="8" fill="currentColor" />
      <path
        d="M12 5.42383L7.137 11.5476L4 8.38694L5.10897 7.28636L7.00734 9.19845L10.7766 4.45215L12 5.42383Z"
        fill="#0D0D0D"
      />
    </svg>
  )
}
