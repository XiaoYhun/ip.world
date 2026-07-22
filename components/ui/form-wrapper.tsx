import { cn } from "@/lib/utils"

const FormWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div
      className={cn(
        "focus-within:ring-focus",
        className
      )}
    >
      {children}
    </div>
  )
}

export default FormWrapper
