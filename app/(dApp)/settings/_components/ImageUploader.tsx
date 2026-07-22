"use client"

import { getAuthToken } from "@dynamic-labs/sdk-react-core"
import * as React from "react"
import { useCallback, useEffect, useState } from "react"
import { uploadImage } from "@/actions/image/upload"
import Image from "@/components/image"
import { cn } from "@/lib/utils"
import { isErrResponse } from "@/types/error"
import { Loader2, UploadIcon, X } from "lucide-react"
import { toast } from "sonner"

interface ImageUploaderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  required?: boolean
  previewUrl?: string
  handleFileChange?: (url: string) => void
  onUploadStarted?: () => void
  onUploadEnded?: () => void
  error?: boolean
}

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const SUBTITLE = "JPG, PNG, or WebP - Max 1MB"

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
      error = false,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [preview, setPreview] = useState<string | undefined>(previewUrl)
    const [touched, setTouched] = useState(false)
    const [fileError, setFileError] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [hasFailed, setHasFailed] = useState(false)
    const [fileName, setFileName] = useState<string>("")
    const [isDragging, setIsDragging] = useState(false)
    const [isHoveringCircle, setIsHoveringCircle] = useState(false)
    const showError = required && touched && !preview

    useEffect(() => {
      setPreview(previewUrl)
    }, [previewUrl])

    const checkAuth = () => {
      const token = getAuthToken()
      if (!token) {
        toast.error("You must be logged in to upload images")
        return false
      }
      return true
    }

    const validateFile = (file: File): boolean => {
      if (!checkAuth()) return false

      if (file.type === "image/gif") {
        toast.error("GIFs are not supported. Please upload a JPG, PNG, or WebP image.")
        setHasFailed(true)
        return false
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`Unsupported format: ${file.type.split("/")[1]?.toUpperCase() || "unknown"}. Use JPG, PNG, or WebP.`)
        setHasFailed(true)
        return false
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`)
        setHasFailed(true)
        return false
      }

      setFileError(null)
      setHasFailed(false)
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
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) {
        setFileName(file.name)
        handleUpdateFile(file)
      }
    }

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setIsDragging(false)
      }
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleUpdateFile = async (file: File) => {
      setPreview(undefined)
      setHasFailed(false)

      if (!validateFile(file)) return

      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
        handleUploadImageFile(file)
      }
      reader.readAsDataURL(file)
    }

    const handleUploadImageFile = async (file: File) => {
      if (!checkAuth()) return

      const formData = new FormData()
      formData.append("file", file)

      setIsUploading(true)
      setHasFailed(false)
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

        handleFileChange?.(imageUploadResponse)
      } catch (err) {
        console.error(err)
        setHasFailed(true)
        setPreview(previewUrl || undefined)
        setFileName("")
        const message = err instanceof Error ? err.message : "Unknown error"
        toast.error(`Upload failed: ${message}`)
      } finally {
        setIsUploading(false)
        onUploadEnded?.()
      }
    }

    const handleRemoveImage = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setFileName("")
      setHasFailed(false)
      setIsUploading(false)
      onUploadEnded?.()

      if (previewUrl) {
        setPreview(previewUrl)
        handleFileChange?.(previewUrl)
      } else {
        setPreview(undefined)
        handleFileChange?.("")
      }

      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }

    const hasImage = !!preview && !isUploading

    return (
      <div
        className={cn(
          "rounded-[12px] border-2 p-3 transition-colors duration-200 -ml-3",
          isDragging
            ? "border-dashed border-neutral-400"
            : "border-transparent",
          className,
        )}
        onDrop={handleDropImage}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
      >
        <label className="flex cursor-pointer items-center gap-4">
          {/* Circle area */}
          <div
            className="relative shrink-0"
            onMouseEnter={() => hasImage && setIsHoveringCircle(true)}
            onMouseLeave={() => setIsHoveringCircle(false)}
          >
            <div
              className={cn(
                "flex size-[56px] items-center justify-center overflow-hidden rounded-full border transition-colors sm:size-[48px]",
                hasFailed
                  ? "border-red"
                  : hasImage
                    ? "border-transparent"
                    : "border-neutral-500 bg-neutral-700",
              )}
            >
              {isUploading && (
                <Loader2 size={22} className="animate-spin text-white" />
              )}
              {hasImage && (
                <Image src={preview} alt="Preview" fill className="rounded-full object-cover" />
              )}
              {!isUploading && !hasImage && (
                <UploadIcon size={20} className="text-neutral-200" />
              )}
            </div>

            {/* Hover overlay — click opens file picker to replace */}
            {hasImage && isHoveringCircle && (
              <div
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  inputRef.current?.click()
                }}
                className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/60 transition-opacity"
              >
                <X size={20} className="text-white" />
              </div>
            )}
          </div>

          {/* Text area */}
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-sm font-semibold text-neutral-200">
              {fileName || "Select Or Drag An Image"}
            </span>
            <span className="text-xs text-neutral-400">{SUBTITLE}</span>
          </div>

          <input
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            onBlur={() => setTouched(true)}
            ref={(element) => {
              inputRef.current = element
              if (typeof ref === "function") {
                ref(element)
              } else if (ref) {
                ref.current = element
              }
            }}
            {...props}
          />
        </label>

        {showError && <p className="mt-2 text-xs text-red">Please upload an image</p>}
        {fileError && <p className="mt-2 text-xs text-red">{fileError}</p>}
      </div>
    )
  }
)

ImageUploader.displayName = "ImageUploader"

export default ImageUploader
