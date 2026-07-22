import type { Address, Hash } from "viem"

const STORAGE_KEY = "ipworld:tx:dlq"
const MAX_ENTRIES = 50

export interface DeadLetterEntry {
  id: string
  hash?: Hash
  nonce: number
  from: Address
  to: Address
  /** Short description: "swap:exactInputSingle", "approve:USDC", etc. */
  label: string
  serializedTx?: string
  error: string
  createdAt: number
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function readStorage(): DeadLetterEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as DeadLetterEntry[]) : []
  } catch {
    return []
  }
}

function writeStorage(entries: DeadLetterEntry[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // localStorage may be full or unavailable
  }
}

class DeadLetterQueue {
  enqueue(
    entry: Omit<DeadLetterEntry, "id" | "createdAt">,
  ): DeadLetterEntry {
    const full: DeadLetterEntry = {
      ...entry,
      id: generateId(),
      createdAt: Date.now(),
    }

    const entries = readStorage()
    entries.push(full)

    // FIFO eviction
    while (entries.length > MAX_ENTRIES) {
      entries.shift()
    }

    writeStorage(entries)
    this.notifyListeners()
    return full
  }

  dequeue(id: string): void {
    const entries = readStorage().filter((e) => e.id !== id)
    writeStorage(entries)
    this.notifyListeners()
  }

  getAll(): DeadLetterEntry[] {
    return readStorage()
  }

  clear(): void {
    writeStorage([])
    this.notifyListeners()
  }

  get size(): number {
    return readStorage().length
  }

  // --- Listener support for the React hook ---
  private listeners = new Set<() => void>()

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners(): void {
    for (const fn of this.listeners) {
      fn()
    }
  }
}

export const deadLetterQueue = new DeadLetterQueue()
