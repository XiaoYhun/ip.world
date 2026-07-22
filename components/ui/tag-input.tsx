import { useState } from "react"

interface TagInputProps {
  label?: React.ReactNode
  defaultValue?: string
  onChange: (tags: string) => void
  maxTags?: number
  placeholder?: string
  wrapperclassname?: string
  required?: boolean
  separator?: string
  ref?: React.RefCallback<HTMLInputElement>
}

const TagInput = ({
  label,
  defaultValue = "",
  onChange,
  maxTags = 10,
  placeholder = "press enter or space to add a tag",
  required = true,
  wrapperclassname,
  separator = ",", // Allow custom separator
  ref,
}: TagInputProps) => {
  const [tags, setTags] = useState<string>(defaultValue)
  const [inputValue, setInputValue] = useState("")
  const [error, setError] = useState<string>("")

  const getTagsArray = () =>
    tags
      ? tags
          .split(separator)
          .map((t) => t.trim())
          .filter(Boolean)
      : []

  const handleAddTag = (newTag: string) => {
    const trimmedTag = newTag.trim().toLowerCase()
    const currentTags = getTagsArray()

    if (!trimmedTag) return

    if (currentTags.length >= maxTags) {
      setError(`Maximum ${maxTags} tags allowed`)
      return
    }

    if (currentTags.includes(trimmedTag)) {
      setError(`Tag "${trimmedTag}" already exists`)
      return
    }

    const updatedTags = currentTags.length > 0 ? `${tags}${separator} ${trimmedTag}` : trimmedTag

    setTags(updatedTags)
    onChange(updatedTags)
    setInputValue("")
    setError("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === ",") {
      e.preventDefault()
      handleAddTag(inputValue)
    } else if (e.key === "Backspace" && !inputValue && getTagsArray().length > 0) {
      const updatedTags = getTagsArray().slice(0, -1).join(`${separator} `)
      setTags(updatedTags)
      onChange(updatedTags)
      setError("")
    }
  }

  const handleBlur = () => {
    if (inputValue) {
      handleAddTag(inputValue)
    }
  }

  const removeTag = (tagToRemove: string) => {
    const updatedTags = getTagsArray()
      .filter((tag) => tag !== tagToRemove)
      .join(`${separator} `)
    setTags(updatedTags)
    onChange(updatedTags)
    setError("")
  }

  return (
    <div className="relative">
      <div className={wrapperclassname}>
        {label && (
          <label className="text-sm leading-normal font-normal">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <div className="flex items-center gap-2">
          <div className="flex w-full flex-wrap items-center gap-2">
            {getTagsArray().map((tag) => (
              <span key={tag} className="bg-neutral-600 flex items-center gap-1 rounded px-2 py-1 text-xs">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-neutral-400"
                  aria-label={`Remove tag ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              ref={ref}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                setError("")
              }}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="min-w-[120px] flex-1 bg-transparent text-sm outline-hidden placeholder:font-normal placeholder:text-neutral-300"
              placeholder={getTagsArray().length === 0 ? placeholder : ""}
              disabled={getTagsArray().length >= maxTags}
              aria-disabled={getTagsArray().length >= maxTags}
              aria-label="Add tags"
            />
          </div>
        </div>
      </div>
      {error && <div className="text-red absolute bottom-[-1rem] text-[10px]">{error}</div>}
    </div>
  )
}

export { TagInput }
