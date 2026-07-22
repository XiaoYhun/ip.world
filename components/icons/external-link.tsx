export const ExternalLink = ({ size = 9, className }: { size?: number; className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 9 9"
      fill="none"
      className={className}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.07951 1.125H5.8125V0H8.4375C8.74815 0 9 0.25184 9 0.5625V3.1875H7.875V1.92049L5.27276 4.52276L4.47724 3.72725L7.07951 1.125ZM5.26894 1.875H0.375C0.167893 1.875 0 2.0429 0 2.25V8.625C0 8.83211 0.167893 9 0.375 9H6.75C6.95711 9 7.125 8.83211 7.125 8.625V3.73126L5.50583 5.35043C5.35939 5.49686 5.12197 5.49686 4.9755 5.35043L3.64969 4.02461C3.50324 3.87814 3.50324 3.64071 3.64969 3.49427L5.26894 1.875Z"
        fill="currentColor"
      />
    </svg>
  )
}
