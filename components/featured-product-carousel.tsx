'use client'

import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'

export default function FeaturedProductCarousel({ children }: { children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)

  const move = useCallback((direction: 1 | -1) => {
    const element = track.current
    if (!element) return
    const firstCard = element.firstElementChild as HTMLElement | null
    const cardWidth = firstCard?.getBoundingClientRect().width ?? 280
    const styles = window.getComputedStyle(element)
    const gap = Number.parseFloat(styles.columnGap || styles.gap || '18') || 18
    const step = cardWidth + gap
    const maxScroll = Math.max(0, element.scrollWidth - element.clientWidth)

    if (direction === 1 && element.scrollLeft >= maxScroll - step / 2) {
      element.scrollTo({ left: 0, behavior: 'smooth' })
    } else if (direction === -1 && element.scrollLeft <= step / 2) {
      element.scrollTo({ left: maxScroll, behavior: 'smooth' })
    } else {
      element.scrollBy({ left: direction * step, behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    if (paused) return
    const timer = window.setInterval(() => move(1), 3500)
    return () => window.clearInterval(timer)
  }, [move, paused])

  return (
    <div
      className="featured-carousel"
      aria-label="Featured products carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="featured-products auto-slide-products" ref={track}>{children}</div>
      <div className="featured-carousel-controls" aria-label="Product carousel controls">
        <button type="button" onClick={() => move(-1)} aria-label="Previous product">←</button>
        <button type="button" onClick={() => move(1)} aria-label="Next product">→</button>
      </div>
    </div>
  )
}
