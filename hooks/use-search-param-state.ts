"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState, useTransition } from "react"

type UseSearchParamStateOptions<T> = {
  /**
   * The search param key to sync with
   */
  paramKey: string
  /**
   * Default value when param is not present
   */
  defaultValue: T
  /**
   * Optional serializer to convert value to string for URL
   * @default String(value)
   */
  serialize?: (value: T) => string
  /**
   * Optional deserializer to convert URL string to value
   * @default String as-is
   */
  deserialize?: (urlValue: string | null) => T
  /**
   * Whether to replace history instead of push
   * @default true
   */
  replace?: boolean
  /**
   * Whether to scroll to top on param change
   * @default false
   */
  scroll?: boolean
  /**
   * Whether to shallow route (don't trigger data fetching)
   * Note: Next.js 13+ app router doesn't have shallow routing, this is kept for API compatibility
   * @default true
   */
  shallow?: boolean
}

/**
 * Hook to sync a state value with URL search params
 *
 * @example
 * // Simple string param
 * const [search, setSearch] = useSearchParamState({
 *   paramKey: "q",
 *   defaultValue: "",
 * })
 *
 * @example
 * // Boolean param
 * const [isActive, setIsActive] = useSearchParamState({
 *   paramKey: "active",
 *   defaultValue: false,
 *   serialize: (value) => value ? "true" : "false",
 *   deserialize: (urlValue) => urlValue === "true",
 * })
 *
 * @example
 * // Number param
 * const [page, setPage] = useSearchParamState({
 *   paramKey: "page",
 *   defaultValue: 1,
 *   serialize: (value) => String(value),
 *   deserialize: (urlValue) => urlValue ? parseInt(urlValue, 10) : 1,
 * })
 */
export function useSearchParamState<T = string>({
  paramKey,
  defaultValue,
  serialize = (value: T) => String(value),
  deserialize,
  replace = true,
  scroll = false,
}: UseSearchParamStateOptions<T>): [T, (value: T | ((prev: T) => T)) => void] {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // Default deserializer if not provided
  const defaultDeserialize = useCallback(
    (urlValue: string | null): T => {
      if (urlValue === null) return defaultValue
      // If T is string, return as-is (cast needed for TypeScript)
      return urlValue as unknown as T
    },
    [defaultValue]
  )

  const finalDeserialize = deserialize || defaultDeserialize

  // Initialize state from URL or default
  const [state, setState] = useState<T>(() => {
    const urlValue = searchParams.get(paramKey)
    return finalDeserialize(urlValue)
  })

  // Update URL when state changes
  const updateSearchParam = useCallback(
    (value: T | ((prev: T) => T)) => {
      // Handle functional updates
      const newValue = typeof value === "function" ? (value as (prev: T) => T)(state) : value

      setState(newValue)

      // Create new URLSearchParams from current params
      const params = new URLSearchParams(searchParams.toString())

      // Update or remove the param
      const serializedValue = serialize(newValue)

      // If the serialized value equals default, remove it to keep URL clean
      if (serializedValue === serialize(defaultValue)) {
        params.delete(paramKey)
      } else {
        params.set(paramKey, serializedValue)
      }

      // Build new URL
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname

      // Navigate with the appropriate method (non-blocking)
      startTransition(() => {
        if (replace) {
          router.replace(newUrl, { scroll })
        } else {
          router.push(newUrl, { scroll })
        }
      })
    },
    [state, searchParams, pathname, router, paramKey, serialize, defaultValue, replace, scroll, startTransition]
  )

  // Sync state when URL changes (e.g., browser back/forward)
  useEffect(() => {
    const urlValue = searchParams.get(paramKey)
    const deserializedValue = finalDeserialize(urlValue)

    // Only update if different to avoid unnecessary re-renders
    if (JSON.stringify(deserializedValue) !== JSON.stringify(state)) {
      setState(deserializedValue)
    }
  }, [searchParams, paramKey, finalDeserialize])

  return [state, updateSearchParam]
}

/**
 * Hook to manage multiple search params at once
 *
 * @example
 * const searchParamsManager = useSearchParamsManager()
 *
 * // Get a param
 * const search = searchParamsManager.get("q")
 *
 * // Set a param
 * searchParamsManager.set("q", "hello")
 *
 * // Set multiple params
 * searchParamsManager.setMultiple({ q: "hello", page: "2" })
 *
 * // Delete a param
 * searchParamsManager.delete("q")
 *
 * // Clear all params
 * searchParamsManager.clear()
 */
export function useSearchParamsManager(options?: { replace?: boolean; scroll?: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { replace = false, scroll = false } = options || {}

  const get = useCallback(
    (key: string): string | null => {
      return searchParams.get(key)
    },
    [searchParams]
  )

  const set = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(key, value)
      const newUrl = `${pathname}?${params.toString()}`

      if (replace) {
        router.replace(newUrl, { scroll })
      } else {
        router.push(newUrl, { scroll })
      }
    },
    [searchParams, pathname, router, replace, scroll]
  )

  const setMultiple = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname

      if (replace) {
        router.replace(newUrl, { scroll })
      } else {
        router.push(newUrl, { scroll })
      }
    },
    [searchParams, pathname, router, replace, scroll]
  )

  const deleteParam = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete(key)
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname

      if (replace) {
        router.replace(newUrl, { scroll })
      } else {
        router.push(newUrl, { scroll })
      }
    },
    [searchParams, pathname, router, replace, scroll]
  )

  const clear = useCallback(() => {
    if (replace) {
      router.replace(pathname, { scroll })
    } else {
      router.push(pathname, { scroll })
    }
  }, [pathname, router, replace, scroll])

  const getAll = useCallback(() => {
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })
    return params
  }, [searchParams])

  return {
    get,
    set,
    setMultiple,
    delete: deleteParam,
    clear,
    getAll,
    searchParams,
  }
}

/**
 * Specialized hook for boolean search params
 */
export function useBooleanSearchParam(
  paramKey: string,
  defaultValue: boolean = false,
  options?: Omit<UseSearchParamStateOptions<boolean>, "paramKey" | "defaultValue" | "serialize" | "deserialize">
) {
  return useSearchParamState<boolean>({
    paramKey,
    defaultValue,
    serialize: (value) => (value ? "true" : "false"),
    deserialize: (urlValue) => urlValue === "true",
    ...options,
  })
}

/**
 * Specialized hook for number search params
 */
export function useNumberSearchParam(
  paramKey: string,
  defaultValue: number = 0,
  options?: Omit<UseSearchParamStateOptions<number>, "paramKey" | "defaultValue" | "serialize" | "deserialize">
) {
  return useSearchParamState<number>({
    paramKey,
    defaultValue,
    serialize: (value) => String(value),
    deserialize: (urlValue) => (urlValue ? parseInt(urlValue, 10) : defaultValue),
    ...options,
  })
}

/**
 * Specialized hook for string array search params (comma-separated)
 */
export function useArraySearchParam(
  paramKey: string,
  defaultValue: string[] = [],
  options?: Omit<UseSearchParamStateOptions<string[]>, "paramKey" | "defaultValue" | "serialize" | "deserialize">
) {
  return useSearchParamState<string[]>({
    paramKey,
    defaultValue,
    serialize: (value) => value.join(","),
    deserialize: (urlValue) => (urlValue ? urlValue.split(",").filter(Boolean) : defaultValue),
    ...options,
  })
}

/**
 * Type helpers for search param values
 */
type SearchParamValue = string | number | boolean | string[]

type SearchParamsObject = Record<string, SearchParamValue>

type UseSearchParamsObjectOptions = {
  /**
   * Whether to replace history instead of push
   * @default false
   */
  replace?: boolean
  /**
   * Whether to scroll to top on param change
   * @default false
   */
  scroll?: boolean
  /**
   * Custom serializers for specific keys
   * @example { startDate: (date) => date.toISOString() }
   */
  serializers?: Record<string, (value: any) => string>
  /**
   * Custom deserializers for specific keys
   * @example { startDate: (str) => new Date(str) }
   */
  deserializers?: Record<string, (urlValue: string | null) => any>
  /**
   * Param keys to exclude from URL sync
   * Useful for internal-only state that shouldn't be in the URL
   */
  exclude?: string[]
}

/**
 * Hook to sync an object of multiple values with URL search params
 * Each key in the object becomes a separate search param
 *
 * @example
 * // Simple usage
 * const [filters, setFilters] = useSearchParamsObject({
 *   search: "",
 *   type: "all",
 *   verified: false,
 *   page: 1,
 * })
 *
 * // Update single field
 * setFilters({ search: "hello" })
 *
 * // Update multiple fields
 * setFilters({ search: "hello", page: 1 })
 *
 * // Functional update
 * setFilters(prev => ({ ...prev, page: prev.page + 1 }))
 *
 * @example
 * // With custom serializers
 * const [filters, setFilters] = useSearchParamsObject(
 *   {
 *     startDate: new Date(),
 *     endDate: new Date(),
 *     tags: ["tech", "design"],
 *   },
 *   {
 *     serializers: {
 *       startDate: (date) => date.toISOString(),
 *       endDate: (date) => date.toISOString(),
 *     },
 *     deserializers: {
 *       startDate: (str) => str ? new Date(str) : new Date(),
 *       endDate: (str) => str ? new Date(str) : new Date(),
 *     },
 *   }
 * )
 */
export function useSearchParamsObject<T extends SearchParamsObject>(
  defaultValues: T,
  options?: UseSearchParamsObjectOptions
): [T, (updates: Partial<T> | ((prev: T) => Partial<T>)) => void, () => void] {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { replace = false, scroll = false, serializers = {}, deserializers = {}, exclude = [] } = options || {}

  // Default serializer function
  const defaultSerialize = useCallback(
    (key: string, value: any): string => {
      if (serializers[key]) {
        return serializers[key](value)
      }

      const type = typeof value
      if (type === "boolean") {
        return value ? "true" : "false"
      }
      if (type === "number") {
        return String(value)
      }
      if (Array.isArray(value)) {
        return value.join(",")
      }
      return String(value)
    },
    [serializers]
  )

  // Default deserializer function
  const defaultDeserialize = useCallback(
    (key: string, urlValue: string | null, defaultValue: any): any => {
      if (deserializers[key]) {
        return deserializers[key](urlValue)
      }

      if (urlValue === null) {
        return defaultValue
      }

      const defaultType = typeof defaultValue
      if (defaultType === "boolean") {
        return urlValue === "true"
      }
      if (defaultType === "number") {
        return parseInt(urlValue, 10)
      }
      if (Array.isArray(defaultValue)) {
        return urlValue ? urlValue.split(",").filter(Boolean) : defaultValue
      }
      return urlValue
    },
    [deserializers]
  )

  // Initialize state from URL or defaults
  const [state, setState] = useState<T>(() => {
    const initialState = { ...defaultValues }

    Object.keys(defaultValues).forEach((key) => {
      if (!exclude.includes(key)) {
        const urlValue = searchParams.get(key)
        if (urlValue !== null) {
          initialState[key as keyof T] = defaultDeserialize(key, urlValue, defaultValues[key])
        }
      }
    })

    return initialState
  })

  // Update URL when state changes
  const updateState = useCallback(
    (updates: Partial<T> | ((prev: T) => Partial<T>)) => {
      // Handle functional updates
      const partialUpdates = typeof updates === "function" ? updates(state) : updates

      // Merge with current state
      const newState = { ...state, ...partialUpdates }

      setState(newState)

      // Create new URLSearchParams from current params
      const params = new URLSearchParams(searchParams.toString())

      // Update params for all keys in the new state
      Object.keys(newState).forEach((key) => {
        if (exclude.includes(key)) {
          // Skip excluded keys
          return
        }

        const value = newState[key as keyof T]
        const defaultValue = defaultValues[key as keyof T]
        const serializedValue = defaultSerialize(key, value)
        const serializedDefault = defaultSerialize(key, defaultValue)

        // If value equals default, remove from URL for cleaner URLs
        if (serializedValue === serializedDefault) {
          params.delete(key)
        } else {
          params.set(key, serializedValue)
        }
      })

      // Build new URL
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname

      // Navigate with the appropriate method
      if (replace) {
        router.replace(newUrl, { scroll })
      } else {
        router.push(newUrl, { scroll })
      }
    },
    [state, searchParams, pathname, router, defaultValues, defaultSerialize, replace, scroll, exclude]
  )

  // Reset to defaults
  const reset = useCallback(() => {
    setState(defaultValues)
    if (replace) {
      router.replace(pathname, { scroll })
    } else {
      router.push(pathname, { scroll })
    }
  }, [defaultValues, pathname, router, replace, scroll])

  // Sync state when URL changes (e.g., browser back/forward)
  useEffect(() => {
    const newState = { ...state }
    let hasChanges = false

    Object.keys(defaultValues).forEach((key) => {
      if (exclude.includes(key)) {
        return
      }

      const urlValue = searchParams.get(key)
      const deserializedValue = defaultDeserialize(key, urlValue, defaultValues[key])

      // Only update if different to avoid unnecessary re-renders
      if (JSON.stringify(deserializedValue) !== JSON.stringify(state[key as keyof T])) {
        newState[key as keyof T] = deserializedValue
        hasChanges = true
      }
    })

    if (hasChanges) {
      // Use queueMicrotask to defer state update and avoid cascading renders
      queueMicrotask(() => {
        setState(newState)
      })
    }
  }, [searchParams, defaultValues, defaultDeserialize, exclude, state])

  return [state, updateState, reset]
}
