"use client"

import { XIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "./button"

const MultiBtnSelect = ({ options, onChange }: { options: string[]; onChange: (options: string[]) => void }) => {
  const [selected, setSelected] = useState<string[]>([])

  const handleSelect = (key: string) => {
    if (selected.includes(key)) {
      setSelected((prev) => prev.filter((k) => k !== key))
    } else {
      setSelected((prev) => [...prev, key])
    }
  }

  useEffect(() => {
    onChange(selected)
  }, [onChange, selected])

  return (
    <div className="flex items-center gap-2">
      {options.map((option) => (
        <Button
          key={`multi-btn-select-${option}`}
          variant={selected.includes(option) ? "default" : "outline"}
          onClick={() => handleSelect(option)}
          className="p-2"
        >
          <span className="flex items-center text-xs">
            {option}
            {selected.includes(option) && <XIcon size={16} />}
          </span>
        </Button>
      ))}
    </div>
  )
}

export { MultiBtnSelect }
