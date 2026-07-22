export const Medal = ({ size = 12, className = "" }: { size?: number; className?: string }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6 8.25C3.79086 8.25 2 6.45915 2 4.25C2 2.04086 3.79086 0.25 6 0.25C8.20915 0.25 10 2.04086 10 4.25C10 6.45915 8.20915 8.25 6 8.25ZM6 2.4541L6.6148 3.50806L7.74435 3.85561L6.98475 4.61522L7.24355 5.90935L6 5.34835L4.75645 5.90935L5.01525 4.61522L4.25566 3.85561L5.3852 3.50806L6 2.4541ZM6 9.24995C5.0893 9.24995 4.23544 9.0065 3.5 8.58105V11V12L4.3 11.4L6 10.125L7.7 11.4L8.5 12V8.58105C7.76455 9.0065 6.9107 9.24995 6 9.24995Z"
        fill="currentColor"
      />
    </svg>
  )
}
