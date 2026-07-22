export const Deposit = ({ size = 16, color = "#B3B3B3" }: { size?: number; color?: string }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.6667 4.66667C12.6667 7.244 10.5773 9.33333 8 9.33333C5.42267 9.33333 3.33333 7.244 3.33333 4.66667C3.33333 2.08934 5.42267 0 8 0C10.5773 0 12.6667 2.08934 12.6667 4.66667ZM7.33333 12.6667V10.6667H8.66666V12.6667H11.3333L8 16L4.66666 12.6667H7.33333Z"
        fill={color}
      />
    </svg>
  )
}
