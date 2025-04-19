"use client"

import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window !== "undefined") {
      const media = window.matchMedia(query)

      // Set initial value
      setMatches(media.matches)

      // Define listener function
      const listener = () => setMatches(media.matches)

      // Use modern event listener pattern
      media.addEventListener("change", listener)

      // Clean up
      return () => media.removeEventListener("change", listener)
    }

    // Default to false on server
    return () => {}
  }, [query])

  return matches
}
