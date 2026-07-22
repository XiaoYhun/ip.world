import { useRef, useState } from "react"
import { useDebouncedCallback } from "use-debounce"

import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect"

const getDimensions = (element: HTMLElement | null) => {
  if (!element) {
    return {
      scrollWidth: 0,
      scrollHeight: 0,
      clientWidth: 0,
      clientHeight: 0,
    }
  }
  return {
    scrollWidth: element.scrollWidth,
    scrollHeight: element.scrollHeight,
    clientWidth: element.clientWidth,
    clientHeight: element.clientHeight,
  }
}

const DEBOUNCED_ONCHANGE_INTERVAL_MS = 250

/**
 * A custom hook that helps you track the dimensions of an HTML element.
 *
 * returns ->
 *    { ref, width, height}
 *    ref    = attach this to the element you wish to get the dimensions of.  Note that resizing of
 *             the browser or changing of the contents of ref will cause width and height to be
 *             recalculated.
 *    clientWidth  = clientWidth of ref.current
 *    clientHeight = clientHeight of ref.current
 *    scrollWidth  = scrollWidth of ref.current
 *    scrollHeight = scrollHeight of ref.current
 *
 * typeParam ->
 *    the type of HTML element you will attach ref to
 *
 * Example:
 *    const { ref, clientWidth, clientHeight, scrollWidth, scrollHeight } = useDimensions<HTMLDivElement>();
 *    return (
 *      <div ref={ref}>This div's pixel width is {width} and height is {height}</div>
 *    );
 *
 */
const useDimensions = <T extends HTMLElement>() => {
  const ref = useRef<T>(null)
  const [dimensions, setDimensions] = useState(() => getDimensions(null))

  const handleResize = useDebouncedCallback(() => {
    if (ref.current) {
      setDimensions(getDimensions(ref.current))
    }
  }, DEBOUNCED_ONCHANGE_INTERVAL_MS)

  useIsomorphicLayoutEffect(() => {
    if (!ref.current) {
      return
    }
    handleResize()
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(ref.current)

    return function cleanup() {
      resizeObserver.disconnect()
    }
  }, [ref, handleResize])

  return { ref, ...dimensions }
}

export default useDimensions
