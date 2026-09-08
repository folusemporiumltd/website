'use client'

import { ReactNode, useEffect, useRef } from 'react'

export default function FeaturedProductCarousel({ children }: { children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const advance = () => {
      const element = track.current
      if (!element) return
      const cardWidth = Math.max(270, element.firstElementChild?.getBoundingClientRect().width ?? 270)
      const atEnd = element.scrollLeft + element.clientWidth >= element.scrollWidth - 12
      if (atEnd) element.scrollTo({ left: 0, behavior: 'smooth' })
      else element.scrollBy({ left: cardWidth + 18, behavior: 'smooth' })
    }
    const timer = window.setInterval(advance, 3500)
    return () => window.clearInterval(timer)
  }, [])

  return <div className="featured-carousel" aria-label="Featured products carousel">
    <div className="featured-products auto-slide-products" ref={track}>{children}</div>
  </div>
}
