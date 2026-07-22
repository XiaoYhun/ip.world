export const Note = ({ size = 10 }: { size?: number }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 10 9" fill="none">
      <path
        d="M8.66699 0.5V4.1875H7.49902C6.95253 4.18831 6.42843 4.40555 6.04199 4.79199C5.65555 5.17843 5.43831 5.70253 5.4375 6.24902V7.83301H0.5V0.5H8.66699ZM1.16699 5.8125H3.83301V4.1875H1.16699V5.8125ZM1.16699 4.14551H8V2.52051H1.16699V4.14551ZM2.41699 2.47949H8V0.854492H2.41699V2.47949Z"
        fill="currentColor"
        stroke="currentColor"
      />
    </svg>
  )
}
