'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImageIcon } from 'lucide-react'

interface FallbackImageProps {
  src: string | null
  alt: string
  width?: number
  height?: number
  className?: string
  fill?: boolean
  sizes?: string
  priority?: boolean
  quality?: number
  onError?: () => void
  onLoad?: () => void
}

export function FallbackImage({
  src,
  alt,
  width,
  height,
  className = '',
  fill = false,
  sizes,
  priority = false,
  quality = 85,
  onError,
  onLoad,
}: FallbackImageProps) {
  const [useNextImage, setUseNextImage] = useState(true)
  const [imageError, setImageError] = useState(false)

  // Fallback placeholder component
  const ImagePlaceholder = () => (
    <div className={`w-full h-full bg-gray-200 flex flex-col items-center justify-center text-gray-500 ${className}`}>
      <ImageIcon className="w-12 h-12 mb-2" />
      <span className="text-sm font-medium">No Image</span>
      <span className="text-xs">Available</span>
    </div>
  )

  const handleError = () => {
    setImageError(true)
    if (useNextImage) {
      // Try with regular img tag
      setUseNextImage(false)
    }
    onError?.()
  }

  const handleLoad = () => {
    onLoad?.()
  }

  // Show placeholder if no src or error occurred
  if (!src || imageError) {
    return <ImagePlaceholder />
  }

  // Try Next.js Image first
  if (useNextImage) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        className={className}
        sizes={sizes}
        priority={priority}
        quality={quality}
        onError={handleError}
        onLoad={handleLoad}
      />
    )
  }

  // Fallback to regular img tag
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      style={fill ? { objectFit: 'cover', width: '100%', height: '100%' } : undefined}
    />
  )
} 