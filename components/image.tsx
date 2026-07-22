import NextImage, { ImageProps } from "next/image"
import { Suspense } from "react"
import { Skeleton } from "./ui/skeleton"
import { safeImageSrc } from "@/lib/safe-url"

// Image variant types for different use cases
type ImageVariant =
  | "hero" // Above-fold hero images (high priority, high quality)
  | "avatar" // User avatars (lazy, lower quality, small)
  | "thumbnail" // Grid thumbnails (lazy, medium quality)
  | "content" // Content images (lazy, good quality)
  | "background" // Background images (lazy, lower quality)
  | "logo" // Logos and brand elements (high priority, max quality)
  | "default" // Standard lazy loading

interface OptimizedImageProps extends Omit<ImageProps, "priority" | "quality" | "sizes" | "loading"> {
  variant?: ImageVariant
  eager?: boolean
}

const Image = ({ width, height, src, variant = "default", eager = false, ...props }: OptimizedImageProps) => {
  // Get optimization settings based on variant
  const getImageConfig = (variant: ImageVariant, eager: boolean) => {
    switch (variant) {
      case "hero":
        return {
          priority: true,
          quality: 90,
          sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
          loading: "eager" as const,
        }

      case "logo":
        return {
          priority: true,
          quality: 100,
          sizes: `${width}px`,
          loading: "eager" as const,
        }

      case "avatar":
        return {
          priority: false,
          quality: 75,
          sizes: `${width}px`,
          loading: eager ? ("eager" as const) : ("lazy" as const),
        }

      case "thumbnail":
        return {
          priority: false,
          quality: 75,
          sizes: "(max-width: 480px) 200px, (max-width: 768px) 250px, (max-width: 1200px) 320px, 400px",
          loading: eager ? ("eager" as const) : ("lazy" as const),
        }

      case "content":
        return {
          priority: false,
          quality: 85,
          sizes: "(max-width: 768px) 100vw, 800px",
          loading: eager ? ("eager" as const) : ("lazy" as const),
        }

      case "background":
        return {
          priority: false,
          quality: 70,
          sizes: "100vw",
          loading: "lazy" as const,
        }

      default:
        return {
          priority: false,
          quality: 75,
          sizes: width ? `${width}px` : "(max-width: 768px) 100vw, 50vw",
          loading: eager ? ("eager" as const) : ("lazy" as const),
        }
    }
  }

  const config = getImageConfig(variant, eager)

  return (
    <Suspense fallback={<Skeleton className={`w-[${width}px] h-[${height}px]`} />}>
      <NextImage
        {...props}
        priority={config.priority}
        width={width}
        height={height}
        quality={config.quality}
        sizes={config.sizes}
        loading={config.loading}
        src={typeof src === "string" ? safeImageSrc(src) : src || "/svg/placeholder.svg"}
      />
    </Suspense>
  )
}

// Specialized thumbnail component for grids
interface ThumbnailGridImageProps extends Omit<OptimizedImageProps, "variant"> {
  gridIndex: number // Position in grid for progressive loading
  fallbackSrc?: string
}

export const ThumbnailGridImage = ({
  gridIndex,
  fallbackSrc = "/svg/placeholder.svg",
  alt,
  ...props
}: ThumbnailGridImageProps) => {
  // First 6 thumbnails load eagerly for better perceived performance
  const shouldLoadEager = gridIndex < 6

  return (
    <Image
      {...props}
      variant="thumbnail"
      eager={shouldLoadEager}
      src={props.src || fallbackSrc}
      alt={alt || "Thumbnail image"}
    />
  )
}

export default Image
