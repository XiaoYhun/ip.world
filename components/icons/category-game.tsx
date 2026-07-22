export const CategoryGame = ({ size = 16 }: { size?: number }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.5 1C2.567 1 1 2.567 1 4.5V11.5C1 13.433 2.567 15 4.5 15H11.5C13.433 15 15 13.433 15 11.5V4.5C15 2.567 13.433 1 11.5 1H4.5ZM5.25 4.5V6.25H3.5V7.75H5.25V9.5H6.75V7.75H8.5V6.25H6.75V4.5H5.25ZM10.25 6C10.25 6.55228 9.80228 7 9.25 7C8.69772 7 8.25 6.55228 8.25 6C8.25 5.44772 8.69772 5 9.25 5C9.80228 5 10.25 5.44772 10.25 6ZM12.75 8C12.75 8.55228 12.3023 9 11.75 9C11.1977 9 10.75 8.55228 10.75 8C10.75 7.44772 11.1977 7 11.75 7C12.3023 7 12.75 7.44772 12.75 8ZM4 12.5H12V11H4V12.5Z"
        fill="currentColor"
      />
    </svg>
  )
}
