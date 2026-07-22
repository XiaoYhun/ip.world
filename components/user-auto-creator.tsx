"use client"

import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useIsLoggedIn } from "@dynamic-labs/sdk-react-core"
import { useAccount } from "@/hooks/use-account"
import { useProfile } from "@/hooks/use-profile"
import { getAuthToken } from "@/lib/dynamic"

const MAX_ATTEMPTS = 3

export function UserAutoCreator() {
  const isLoggedIn = useIsLoggedIn()
  const { address } = useAccount()
  const { user, isUserLoading } = useProfile()
  const queryClient = useQueryClient()
  const attemptRef = useRef(0)
  const createdRef = useRef(false)

  useEffect(() => {
    if (!isLoggedIn || !address || isUserLoading || createdRef.current) return

    if (user?.wallet_address) {
      createdRef.current = true
      return
    }

    if (attemptRef.current >= MAX_ATTEMPTS) return

    const token = getAuthToken()
    if (!token) return

    attemptRef.current += 1

    const createUserAsync = async () => {
      try {
        const ref = document.cookie
          .split("; ")
          .find((row) => row.startsWith("ref="))
          ?.split("=")[1]

        const res = await fetch("/api/users", {
          method: "POST",
          headers: {
            "X-Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wallet_address: address,
            username: "",
            display_name: "",
            bio: "",
            avatar_url: "",
            referral_code: ref ?? "",
          }),
        })

        if (res.ok || res.status === 409) {
          createdRef.current = true
          queryClient.invalidateQueries({ queryKey: ["user"] })
        } else {
          console.error("[UserAutoCreator] Create failed:", res.status)
        }
      } catch (err) {
        console.error("[UserAutoCreator] Error:", err)
      }
    }

    createUserAsync()
  }, [isLoggedIn, address, user, isUserLoading, queryClient])

  useEffect(() => {
    if (!isLoggedIn) {
      createdRef.current = false
      attemptRef.current = 0
    }
  }, [isLoggedIn])

  return null
}
