"use client"

import { getAuthToken } from "@dynamic-labs/sdk-react-core"
import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { uploadImage } from "@/actions/image/upload"
import Image from "@/components/image"
import { cn } from "@/lib/utils"
import { isErrResponse } from "@/types/error"

interface ImageUploaderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  required?: boolean
  previewUrl?: string
  handleFileChange?: (url: string) => void
  onUploadStarted?: () => void
  onUploadEnded?: () => void
  error?: boolean
}

const MAX_FILE_SIZE = 5 * 1024 * 1024

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

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
    const inputRef = useRef<HTMLInputElement>(null)
    const mergedRef = useCallback(
      (node: HTMLInputElement | null) => {
        (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node
        if (typeof ref === "function") ref(node)
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node
      },
      [ref]
    )

    const [preview, setPreview] = useState<string | undefined>(previewUrl)
    const [touched, setTouched] = useState(false)
    const [fileError, setFileError] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [fileName, setFileName] = useState<string>("")
    const [fileSize, setFileSize] = useState<string>("")
    const [authError, setAuthError] = useState<string | null>(null)
    const showRequiredError = required && touched && !preview
    const hasError = !!(fileError || authError || error || showRequiredError)

    useEffect(() => {
      setPreview(previewUrl)
    }, [previewUrl])

    const triggerInput = () => inputRef.current?.click()

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
        setFileError(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`)
        return false
      }

      setFileError(null)
      return true
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        setFileName(file.name)
        setFileSize(formatFileSize(file.size))
        handleUpdateFile(file)
      }
    }

    const handleDropImage = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      const file = e.dataTransfer.files[0]
      if (file) {
        setFileName(file.name)
        setFileSize(formatFileSize(file.size))
        handleUpdateFile(file)
      }
    }

    const handleUpdateFile = async (file: File) => {
      setPreview(undefined)
      setFileError(null)
      setAuthError(null)

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
      onUploadStarted?.()

      try {
        const token = getAuthToken()
        if (!token) throw new Error("Not authenticated")

        const imageUploadResponse = await uploadImage(formData, "remix", token)
        if (isErrResponse(imageUploadResponse)) throw new Error(imageUploadResponse.error)
        handleFileChange?.(imageUploadResponse)
      } catch (err) {
        console.error(err)
        if (err instanceof Error && err.message === "Not authenticated") {
          setAuthError("You must be logged in to upload images")
        } else {
          setFileError("Upload failed. Please try again.")
        }
      } finally {
        setIsUploading(false)
        onUploadEnded?.()
      }
    }

    const iconButton = (content: React.ReactNode, onClick?: () => void) => (
      <button
        type="button"
        onClick={onClick ?? triggerInput}
        className="flex shrink-0 items-center justify-center rounded-[8px] border-[0.5px] border-neutral-400 bg-neutral-600 p-2 transition-colors hover:bg-neutral-500"
      >
        {content}
      </button>
    )

    return (
      <div
        className="flex flex-1 flex-col gap-2"
        onDrop={handleDropImage}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => e.preventDefault()}
      >
        {label && <label className="text-sm leading-normal font-normal text-neutral-300">{label}</label>}

        {/* Shared hidden input */}
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleImageChange}
          onBlur={() => setTouched(true)}
          ref={mergedRef}
          {...props}
        />

        <div
          className={cn(
            "flex h-[41px] w-full items-center justify-between overflow-hidden rounded-[12px] border bg-[#121212] shadow-[0px_2px_12px_0px_rgba(0,0,0,0.2)] backdrop-blur-[10px] transition-colors",
            hasError
              ? "border-[#ea4949]"
              : "border-dashed border-neutral-500",
            className
          )}
        >
          {/* UPLOADING */}
          {isUploading && (
            <div className="flex w-full items-center justify-between pl-4 pr-2">
              <div className="flex items-end gap-2">
                <span className="text-base font-normal leading-none text-neutral-300">Image*</span>
                <span className="text-xs font-semibold leading-none text-neutral-500">5MB Max</span>
              </div>
              {iconButton(
                <svg className="size-[14px] animate-spin text-neutral-300" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </div>
          )}

          {/* SUCCESS */}
          {!isUploading && preview && !hasError && (
            <div className="flex w-full items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="relative size-[26px] shrink-0 overflow-hidden rounded-[8px]">
                  <Image src={preview} alt="Preview" width={26} height={26} className="h-full w-full object-cover" />
                </div>
                <div className="flex items-end gap-2">
                  <span className="max-w-[140px] truncate text-base font-normal leading-none text-neutral-100">
                    {fileName}
                  </span>
                  <span className="shrink-0 text-xs font-semibold leading-none text-neutral-500">{fileSize}</span>
                </div>
              </div>
              {iconButton(
                <Image src="/svg/upload.svg" alt="Re-upload" width={13} height={13} />
              )}
            </div>
          )}

          {/* ERROR */}
          {!isUploading && hasError && (
            <div className="flex w-full items-center justify-between pl-4 pr-2">
              <div className="flex items-end gap-2">
                <span className="max-w-[160px] truncate text-base font-normal leading-none text-neutral-100">
                  {fileName || "Upload failed"}
                </span>
                {fileSize && (
                  <span className="shrink-0 text-xs font-semibold leading-none text-neutral-500">{fileSize}</span>
                )}
              </div>
              {iconButton(
                <svg
                  className="size-[12px] text-neutral-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )}
            </div>
          )}

          {/* EMPTY / DEFAULT */}
          {!isUploading && !preview && !hasError && (
            <button
              type="button"
              onClick={triggerInput}
              className="flex w-full cursor-pointer items-center justify-between pl-4 pr-2"
            >
              <div className="flex items-end gap-2">
                <span className="text-base font-normal leading-none text-neutral-300">Image*</span>
                <span className="text-xs font-semibold leading-none text-neutral-500">5MB Max</span>
              </div>
              {iconButton(
                <Image src="/svg/upload.svg" alt="Upload" width={14} height={14} />
              )}
            </button>
          )}
        </div>

        {authError && <p className="w-full text-xs text-red-500">{authError}</p>}
        {fileError && <p className="w-full text-xs text-red-500">{fileError}</p>}
        {showRequiredError && !fileError && !authError && (
          <p className="w-full text-xs text-red-500">Please upload an image</p>
        )}
      </div>
    )
  }
)

ImageUploader.displayName = "ImageUploader"

export default ImageUploader
