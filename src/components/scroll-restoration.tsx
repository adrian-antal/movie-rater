'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function ScrollRestoration() {
  const pathname = usePathname()

  useEffect(() => {
    // Store the current scroll position before navigation
    const storeScrollPosition = () => {
      sessionStorage.setItem('scrollPosition', window.scrollY.toString())
    }

    // Restore scroll position on page load if it's a back navigation
    const restoreScrollPosition = () => {
      // Small delay to ensure page is fully rendered
      setTimeout(() => {
        const savedPosition = sessionStorage.getItem('scrollPosition')
        if (savedPosition && window.history.state?.scroll !== false) {
          window.scrollTo({
            top: parseInt(savedPosition, 10),
            behavior: 'instant'
          })
        }
      }, 50)
    }

    // Store scroll position before leaving the page
    window.addEventListener('beforeunload', storeScrollPosition)
    
    // Restore position when coming back
    restoreScrollPosition()

    return () => {
      window.removeEventListener('beforeunload', storeScrollPosition)
    }
  }, [pathname])

  return null
} 