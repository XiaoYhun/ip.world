export const CircleX = ({ size = 16 }: { size?: number }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="8" fill="currentColor" />
      <path
        d="M11.1768 5.5752L11.0889 5.66406L5.66406 11.0889L5.5752 11.1768L4.82324 10.4248L4.91113 10.3359L10.3359 4.91113L10.4248 4.82324L11.1768 5.5752Z"
        fill="#0D0D0D"
        stroke="#0D0D0D"
        strokeWidth="0.25"
      />
      <path
        d="M5.66406 4.91113L11.0889 10.3359L11.1768 10.4248L10.4248 11.1768L10.3359 11.0889L4.91113 5.66406L4.82324 5.5752L5.5752 4.82324L5.66406 4.91113Z"
        fill="#0D0D0D"
        stroke="#0D0D0D"
        strokeWidth="0.25"
      />
    </svg>
  )
}
