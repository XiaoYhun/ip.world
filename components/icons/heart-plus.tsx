export const HeartPlus = ({ size = 17, className }: { size?: number; className?: string }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.43788 0.666504C1.9869 0.666504 0 2.65344 0 5.1044C0 6.28137 0.467559 7.41024 1.29982 8.2425L7.99993 14.9426L8 9.6665H10.3333V7.33317H15.3997C15.7895 6.66197 15.9999 5.89406 15.9999 5.10448C16 2.65348 14.0131 0.666504 11.5621 0.666504C10.3851 0.666504 9.25633 1.13404 8.42407 1.96628L7.99993 2.39036L7.576 1.96637C6.74373 1.13408 5.6149 0.666504 4.43788 0.666504ZM11.6667 8.6665V10.9998H9.33333V12.9998H11.6667V15.3332H13.6667V12.9998H16V10.9998H13.6667V8.6665H11.6667Z"
        fill="currentColor"
        className={className}
      />
    </svg>
  )
}
