export const Solana = ({ size = 16 }: { size?: number }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5.26 16.58a.67.67 0 0 1 .47-.2h15.15a.33.33 0 0 1 .24.57l-2.96 2.96a.67.67 0 0 1-.47.2H2.54a.33.33 0 0 1-.24-.57l2.96-2.96Z"
        fill="url(#sol-a)"
      />
      <path
        d="M5.26 4.2a.68.68 0 0 1 .47-.2h15.15a.33.33 0 0 1 .24.57L18.16 7.5a.67.67 0 0 1-.47.2H2.54a.33.33 0 0 1-.24-.57L5.26 4.2Z"
        fill="url(#sol-b)"
      />
      <path
        d="M18.16 10.34a.67.67 0 0 0-.47-.2H2.54a.33.33 0 0 0-.24.57l2.96 2.96c.12.13.3.2.47.2h15.15a.33.33 0 0 0 .24-.57l-2.96-2.96Z"
        fill="url(#sol-c)"
      />
      <defs>
        <linearGradient id="sol-a" x1="19.47" y1="1.88" x2="7.22" y2="22.53" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
        <linearGradient id="sol-b" x1="14.95" y1="-0.56" x2="2.7" y2="20.09" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
        <linearGradient id="sol-c" x1="17.18" y1="0.64" x2="4.93" y2="21.29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
      </defs>
    </svg>
  )
}
