const HorizontalSliders = ({ size = 12 }: { size?: number }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 12 12" fill="none">
      <g clipPath="url(#clip0_6524_1412)">
        <path d="M0.5 6H4.75" stroke="currentcolor" />
        <path d="M7.25 6H11.5" stroke="currentcolor" />
        <path
          d="M4.75 6C4.75 6.33152 4.8817 6.64946 5.11612 6.88388C5.35054 7.1183 5.66848 7.25 6 7.25C6.33152 7.25 6.64946 7.1183 6.88388 6.88388C7.1183 6.64946 7.25 6.33152 7.25 6C7.25 5.66848 7.1183 5.35054 6.88388 5.11612C6.64946 4.8817 6.33152 4.75 6 4.75C5.66848 4.75 5.35054 4.8817 5.11612 5.11612C4.8817 5.35054 4.75 5.66848 4.75 6Z"
          stroke="currentcolor"
        />
        <path d="M3.5 2H11.5" stroke="currentcolor" />
        <path
          d="M3.5 2C3.5 2.69036 2.94036 3.25 2.25 3.25C1.55964 3.25 1 2.69036 1 2C1 1.30964 1.55964 0.75 2.25 0.75C2.94036 0.75 3.5 1.30964 3.5 2Z"
          stroke="currentcolor"
        />
        <path d="M0.5 10H8.5" stroke="currentcolor" />
        <path
          d="M11 10C11 10.6903 10.4403 11.25 9.75 11.25C9.05965 11.25 8.5 10.6903 8.5 10C8.5 9.30965 9.05965 8.75 9.75 8.75C10.4403 8.75 11 9.30965 11 10Z"
          stroke="currentcolor"
        />
      </g>
      <defs>
        <clipPath id="clip0_6524_1412">
          <rect width="12" height="12" fill="currentcolor" />
        </clipPath>
      </defs>
    </svg>
  )
}

export default HorizontalSliders
