export const ChatBubbleSquare = ({ size = 17 }: { size?: number }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 16 17" fill="none">
      <g>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M0.666626 1.16663H15.3333V13.8333H7.58949L4.51733 15.7336L3.49996 16.3629V13.8333H0.666626V1.16663ZM6.99996 10.8333V8.49996H4.66663V6.49996H6.99996V4.16663H8.99996V6.49996H11.3333V8.49996H8.99996V10.8333H6.99996Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}
