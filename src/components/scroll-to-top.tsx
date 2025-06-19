'use client'

import { useEffect } from 'react'

export function ScrollToTop() {
  useEffect(() => {
    // Only scroll to top on the initial page load of movie details
    // Let browser handle scroll restoration for back/forward navigation
    if (window.location.pathname.startsWith('/movie/')) {
      // Small delay to ensure page is fully loaded
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [])

  return null
} 