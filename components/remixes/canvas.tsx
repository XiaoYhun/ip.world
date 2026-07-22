import { useAnimationFrame } from "motion/react"
import { useEffect, useMemo, useRef } from "react"

interface TrailPoint {
  element: Element
  opacity: number
  scale: number
  createdAt: number
  color: string
}

const CanvasBG = ({ firstRemixId }: { firstRemixId: string }) => {
  const trailPoints = useRef<TrailPoint[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const colorIndex = useRef(0)
  const lastRemixChangeTime = useRef<number>(0)

  const rainbowColors = useMemo(
    () => [
      "#FF0000", // Red
      "#FF7F00", // Orange
      "#FFFF00", // Yellow
      "#00FF00", // Green
      "#0000FF", // Blue
      "#4B0082", // Indigo
      "#9400D3", // Violet
    ],
    []
  )

  // Update color index and reset timer when firstRemixId changes
  useEffect(() => {
    colorIndex.current = (colorIndex.current + 1) % rainbowColors.length
    lastRemixChangeTime.current = Date.now()
  }, [firstRemixId, rainbowColors])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")

    if (!canvas || !context) return

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth * 2
      canvas.height = window.innerHeight * 2
    }

    updateCanvasSize()
    window.addEventListener("resize", updateCanvasSize)
    return () => window.removeEventListener("resize", updateCanvasSize)
  }, [])

  useAnimationFrame(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    const canvasParent = canvas?.parentElement
    if (!canvas || !context || !canvasParent) return

    const remix = canvasParent.querySelector(`[data-remix-id="${firstRemixId}"]`)
    if (!remix) return

    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height)

    // Update trail points
    const point: TrailPoint = {
      element: remix,
      opacity: 1,
      scale: 1,
      createdAt: Date.now(),
      color: rainbowColors[colorIndex.current],
    }

    // Only add new points if we're within 500ms of the remix change
    const timeSinceRemixChange = Date.now() - lastRemixChangeTime.current
    if (timeSinceRemixChange <= 1000) {
      // Only add new point every few frames
      if (!trailPoints.current.length || Date.now() - trailPoints.current[0].createdAt > 50) {
        trailPoints.current.unshift(point)
      }
    }

    // Limit the number of trail points
    if (trailPoints.current.length > 10) {
      trailPoints.current = trailPoints.current.slice(0, 10)
    }

    // Draw trail points
    trailPoints.current.forEach((point) => {
      const timeSinceCreation = Date.now() - point.createdAt
      const pulseLifetime = 2000
      const pulseProgress = timeSinceCreation / pulseLifetime
      const opacity = Math.max(0, 1 - pulseProgress)

      // Get current position and rotation for each frame
      const rect = point.element.getBoundingClientRect()
      let rotation = 0
      const transform = window.getComputedStyle(point.element).transform
      if (transform && transform !== "none") {
        const matrix = transform
          .match(/matrix.*\((.*)\)/)?.[1]
          .split(",")
          .map(Number)
        if (matrix) {
          rotation = Math.atan2(matrix[1], matrix[0])
        }
      }

      context.save()

      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      context.translate(centerX, centerY)
      context.rotate(rotation)
      context.translate(-centerX, -centerY)

      context.fillStyle = `${point.color}${Math.round(opacity * 255)
        .toString(16)
        .padStart(2, "0")}`
      context.beginPath()
      context.rect(rect.left, rect.top, rect.width, rect.height)
      context.fill()

      context.restore()
    })

    // Update trail points
    trailPoints.current = trailPoints.current.filter((point) => point.opacity > 0.01)
  })

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 -z-10"></canvas>
}

export default CanvasBG
