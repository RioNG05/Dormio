'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  if (!isVisible) return null

  return (
    <Button
      size="icon"
      rounded="full"
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 z-50 !h-12 !w-12 shadow-lg shadow-primary/30 hover:-translate-y-1"
      aria-label="Cuộn lên đầu trang"
    >
      <ArrowUp />
    </Button>
  )
}
