"use client"

import { getAuthToken } from "@dynamic-labs/sdk-react-core"
import * as React from "react"
import { useCallback, useEffect, useState } from "react"
import { uploadImage } from "@/actions/image/upload"
import Image from "@/components/image"
import { cn } from "@/lib/utils"
import { isErrResponse } from "@/types/error"
import FormWrapper from "./ui/form-wrapper"
import { Progress } from "./ui/progress"

interface ImageUploaderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  required?: boolean
  previewUrl?: string
  handleFileChange?: (url: string) => void
  onUploadStarted?: () => void
  onUploadEnded?: () => void
  wide?: boolean
  error?: boolean
}

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB in bytes

const ImageUploader = React.forwardRef<HTMLInputElement, ImageUploaderProps>(
  (
    {
      className,
      label,
      required,
      previewUrl,
      handleFileChange,
      onUploadStarted,
      onUploadEnded,
      wide = false,
      error = false,
      ...props
    },
    ref
  ) => {
    const [preview, setPreview] = useState<string | undefined>(previewUrl)
    const [touched, setTouched] = useState(false)
    const [fileError, setFileError] = useState<string | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [isUploading, setIsUploading] = useState(false)
    const [fileName, setFileName] = useState<string>("")
    const [authError, setAuthError] = useState<string | null>(null)
    const showError = required && touched && !preview

    useEffect(() => {
      setPreview(previewUrl)
    }, [previewUrl])

    const checkAuth = () => {
      const token = getAuthToken()
      if (!token) {
        setAuthError("You must be logged in to upload images")
        return false
      }
      setAuthError(null)
      return true
    }

    const validateFile = (file: File): boolean => {
      if (!checkAuth()) return false

      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]

      if (!allowedTypes.includes(file.type)) {
        setFileError("Please upload a valid image file (JPEG, PNG, GIF, or WebP)")
        return false
      }

      if (file.size > MAX_FILE_SIZE) {
        setFileError("File size must be less than 2MB")
        return false
      }

      setFileError(null)
      return true
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        setFileName(file.name)
        handleUpdateFile(file)
      }
    }

    const handleDropImage = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      const file = e.dataTransfer.files[0]
      if (file) {
        setFileName(file.name)
        handleUpdateFile(file)
      }
    }

    const handleUpdateFile = async (file: File) => {
      setPreview(undefined)

      if (!validateFile(file)) return

      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
        handleUploadImageFile(file)
      }
      reader.readAsDataURL(file)
    }

    const simulateProgress = useCallback(() => {
      let progress = 0
      const interval = setInterval(() => {
        progress += 1 // Increment progress by 10% every 200ms
        setUploadProgress(progress)

        if (progress >= 90) {
          clearInterval(interval)
        }
      }, 20) // Adjust the interval for faster/slower progress

      return () => clearInterval(interval)
    }, [])

    const handleUploadImageFile = async (file: File) => {
      if (!checkAuth()) return

      const formData = new FormData()
      formData.append("file", file)

      setUploadProgress(0)
      setIsUploading(true)
      simulateProgress()
      onUploadStarted?.()

      try {
        const token = getAuthToken()
        if (!token) {
          throw new Error("Not authenticated")
        }

        const imageUploadResponse = await uploadImage(formData, "remix", token)
        if (isErrResponse(imageUploadResponse)) {
          throw new Error(imageUploadResponse.error)
        }

        setUploadProgress(100)
        handleFileChange?.(imageUploadResponse)
      } catch (error) {
        console.error(error)
        if (error instanceof Error && error.message === "Not authenticated") {
          setAuthError("You must be logged in to upload images")
        }
      } finally {
        setIsUploading(false)
        onUploadEnded?.()
      }
    }

    if (wide) {
      return (
        <div
          className="flex flex-col gap-2"
          onDrop={handleDropImage}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}
        >
          {label && <label className="text-sm leading-normal font-normal text-neutral-300">{label}</label>}
          <label className="cursor-pointer">
            <FormWrapper
              className={cn(
                "flex h-25 cursor-pointer items-center justify-between rounded p-3 transition-all duration-200",
                "disabled:cursor-not-allowed disabled:opacity-50",
                showError && "border-red-500",
                error && "border-red-500",
                className
              )}
            >
              <div className="flex flex-1 items-center gap-4">
                {preview ? (
                  <div className="relative size-25 flex-shrink-0 p-2">
                    <Image
                      src={preview}
                      alt="Preview"
                      width={94}
                      height={94}
                      className="relative size-full rounded object-contain"
                    />
                    {isUploading && (
                      <div className="absolute right-0 bottom-0 left-0 z-10 flex size-full items-center justify-center rounded bg-black/70">
                        <Progress value={uploadProgress} className="h-4 w-20" color="blue" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded bg-neutral-800">
                    <Image src="/svg/upload.svg" alt="Upload" width={30} height={30} />
                  </div>
                )}

                <div className="ml-5 flex flex-1 flex-col">
                  <h3 className="text-sm text-neutral-300">Select Or Drag Media</h3>
                  <p className="text-xs text-neutral-400">JPG, PNG, or GIF. - Max 2MB</p>
                  {fileName && <p className="text-neutral-4000 truncate text-xs">{fileName}</p>}
                </div>
              </div>
            </FormWrapper>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
              onBlur={() => setTouched(true)}
              ref={ref}
              {...props}
            />
          </label>
          {authError && <p className="text-red text-xs">{authError}</p>}
          {fileError && <p className="text-red text-xs">{fileError}</p>}
          {showError && <p className="text-xs text-red-500">Please upload an image</p>}
        </div>
      )
    }

    return (
      <div
        className="flex flex-col gap-2"
        onDrop={handleDropImage}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => e.preventDefault()}
      >
        {label && <label className="text-sm leading-normal font-normal text-neutral-300">{label}</label>}
        <FormWrapper
          className={cn(
            "flex size-25 cursor-pointer items-center justify-center rounded transition-all duration-200",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showError && "border-red-500",
            className
          )}
        >
          <label className="relative flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2">
            {preview ? (
              <div className="relative h-full w-full">
                <Image
                  src={preview}
                  alt="Preview"
                  width={96}
                  height={96}
                  className="relative h-full w-full object-contain"
                />
                {isUploading && (
                  <div className="absolute top-0 right-0 bottom-0 left-0 z-10 flex items-center justify-center bg-black/70">
                    <Progress value={uploadProgress} className="h-4 w-20" color="blue" />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Image src="/svg/upload.svg" alt="Upload" width={24} height={24} />
                <div className="text-xs font-medium text-neutral-300">5MB Max. JPEG, PNG, AVI</div>
              </div>
            )}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
              onBlur={() => setTouched(true)}
              ref={ref}
              {...props}
            />
          </label>
        </FormWrapper>
        {authError && <p className="text-red max-w-[6.25rem] text-xs">{authError}</p>}
        {fileError && <p className="text-red max-w-[6.25rem] text-xs">{fileError}</p>}
        {showError && <p className="max-w-[6.25rem] text-xs text-red-500">Please upload an image</p>}
      </div>
    )
  }
)

ImageUploader.displayName = "ImageUploader"

export default ImageUploader
