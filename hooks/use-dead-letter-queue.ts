"use client"

// todo: implement at a later stage
import { useSyncExternalStore, useCallback } from "react"
import {
  deadLetterQueue,
  type DeadLetterEntry,
} from "@/lib/web3/dead-letter-queue"

function getSnapshot(): DeadLetterEntry[] {
  return deadLetterQueue.getAll()
}

function getServerSnapshot(): DeadLetterEntry[] {
  return []
}

export function useDeadLetterQueue() {
  const entries = useSyncExternalStore(
    (cb) => deadLetterQueue.subscribe(cb),
    getSnapshot,
    getServerSnapshot,
  )

  const remove = useCallback((id: string) => {
    deadLetterQueue.dequeue(id)
  }, [])

  const clear = useCallback(() => {
    deadLetterQueue.clear()
  }, [])

  return { entries, remove, clear, count: entries.length }
}
