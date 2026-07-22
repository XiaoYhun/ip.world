export const Star = ({ size = 20, fill = "#fff" }: { size?: number; fill?: string }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 20.4H20V0.4H0V20.4Z" fill={fill} />
    </svg>
  )
}
