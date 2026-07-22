import Spinner from "@/components/ui/spinner"

const SettingsLoading = () => {
  return (
    <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
      <Spinner />
    </div>
  )
}

export default SettingsLoading
