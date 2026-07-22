export const OwnerWarning = ({ size = 11 }: { size?: number }) => {
  const height = (size * 10) / 11
  return (
    <svg width={size} height={height} viewBox="0 0 11 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.49999 0L11 10H0L5.49999 0ZM4.8126 6.1368V3.86435H6.18738V6.1368H4.8126ZM4.8126 8.40934V7.04585H6.18738V8.40934H4.8126Z"
        fill="#EA4949"
      />
    </svg>
  )
}
