import { useEffect, useRef, useState } from "react"

export function useFullscreen<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const scrollYBeforeFullscreen = useRef(0)

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement
      setIsFullscreen(isNowFullscreen)

      if (!isNowFullscreen) {
        setTimeout(() => {
          window.scrollTo({ top: scrollYBeforeFullscreen.current })
        }, 50)
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const enterFullscreen = () => {
    if (ref.current) {
      scrollYBeforeFullscreen.current = window.scrollY
      ref.current.requestFullscreen?.()
    }
  }

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.()
    }
  }

  const toggleFullscreen = () => {
    document.fullscreenElement ? exitFullscreen() : enterFullscreen()
  }

  return { ref, isFullscreen, toggleFullscreen }
}

