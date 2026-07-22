import { useState } from "react"

export function usePrevious<T>(value: T): T | undefined {
  const [tuple, setTuple] = useState<[T, T | undefined]>([value, undefined])

  if (tuple[0] !== value) {
    setTuple([value, tuple[0]])
  }

  return tuple[1]
}
