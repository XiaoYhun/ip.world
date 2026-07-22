export const Person = ({ size = 20 }: { size?: number }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.5 0.375H3.5V3.29167C3.5 5.22466 5.067 6.79167 7 6.79167C8.93299 6.79167 10.5 5.22466 10.5 3.29167V0.375ZM7 7.95833C4.89505 7.95833 2.91247 8.48975 1.18085 9.42618L0.875 9.59155V12.625H13.125V9.59155L12.8192 9.42618C11.0875 8.48975 9.10496 7.95833 7 7.95833Z"
        fill="currentColor"
      />
    </svg>
  )
}
