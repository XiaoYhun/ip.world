export const Compass = ({ size = 20 }: { size?: number }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 20 20" fill="none">
      <g>
        <path
          d="M11.5625 10C11.5625 10.863 10.863 11.5625 10 11.5625C9.13705 11.5625 8.4375 10.863 8.4375 10C8.4375 9.13705 9.13705 8.4375 10 8.4375C10.863 8.4375 11.5625 9.13705 11.5625 10Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10 20C15.5229 20 20 15.5229 20 10C20 4.47715 15.5229 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5229 4.47715 20 10 20ZM7.5 6.25H15L12.5 13.75H5L7.5 6.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}
