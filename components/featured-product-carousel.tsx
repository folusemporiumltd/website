'use client'

import { ReactNode, useEffect, useRef } from 'react'

export default function FeaturedProductCarousel({ children }: { children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null)

  function move(direction: number) {
    const element = track.current
    if (!element) return
    const amount = Math.min(360, Math.max(260, element.clientWidth * 0.82))
    const atEnd = element.scrollLeft + element.clientWidth >= element.scrollWidth - 8
    if (direction > 0 && atEnd) element.scrollTo({ left: 0, behavior: 'smooth' })
    else element.scrollBy({ left: direction * amount, behavior: 'smooth' })
  }

  useEffect(() => {
    const timer = window.setInterval(() => move(1), 4500)
    return () => window.clearInterval(timer)
  }, [])

  return <div className="featured-carousel">
    <div className="featured-carousel-controls"><button type="button" onClick={() => move(-1)} aria-label="Previous featured products">←</button><button type="button" onClick={() => move(1)} aria-label="Next featured products">→</button></div>
    <div className="featured-products" ref={track}>{children}</div>
  </div>
}
