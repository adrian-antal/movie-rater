import Image from 'next/image'
import { FallbackImage } from '@/components/fallback-image'
import Link from 'next/link'
import { Star, Heart, Bookmark, BookmarkCheck, ImageIcon } from 'lucide-react'
import { Movie } from '@/types/movie'
import { getImageUrl } from '@/lib/tmdb'
import { formatRating } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useWatchlist } from '@/hooks/use-watchlist'
import { useFavorites } from '@/hooks/use-favorites'

interface MovieCardProps {
  movie: Movie
  className?: string
  showActions?: boolean
}

export function MovieCard({ movie, className, showActions = true }: MovieCardProps) {
  const [imageError, setImageError] = useState(false)
  const { user } = useAuth()
  const { isInWatchlist, toggleWatchlist, isItemLoading: isWatchlistLoading } = useWatchlist()
  const { isInFavorites, toggleFavorites, isItemLoading: isFavoritesLoading } = useFavorites()
  const imageUrl = getImageUrl(movie.poster_path, 'w500')
  const rating = formatRating(movie.vote_average)
  
  // Safe date parsing
  const getReleaseYear = (dateString: string) => {
    if (!dateString) return 'TBA'
    const year = new Date(dateString).getFullYear()
    return isNaN(year) ? 'TBA' : year.toString()
  }

  // Fallback placeholder component
  const ImagePlaceholder = () => (
    <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center text-gray-500">
      <ImageIcon className="w-12 h-12 mb-2" />
      <span className="text-sm font-medium">No Image</span>
      <span className="text-xs">Available</span>
    </div>
  )

  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation when clicking action buttons
    e.stopPropagation()

    if (!user) {
      // Could show auth modal here or just return
      return
    }

    const result = await toggleWatchlist(movie)
    if (result.error) {
      console.error('Error toggling watchlist:', result.error)
    }
  }

  const handleFavoritesToggle = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation when clicking action buttons
    e.stopPropagation()

    if (!user) {
      // Could show auth modal here or just return
      return
    }

    const result = await toggleFavorites(movie)
    if (result.error) {
      console.error('Error toggling favorites:', result.error)
    }
  }

  const isInUserWatchlist = user ? isInWatchlist(movie.id) : false
  const isInUserFavorites = user ? isInFavorites(movie.id) : false
  const isWatchlistLoadingState = isWatchlistLoading(movie.id)
  const isFavoritesLoadingState = isFavoritesLoading(movie.id)
  
  return (
    <Link href={`/movie/${movie.id}`} className={cn("block", className)}>
      <Card className="group overflow-hidden transition-all hover:scale-105 hover:shadow-lg cursor-pointer h-full flex flex-col">
        <div className="relative aspect-[2/3] overflow-hidden bg-gray-100 flex-shrink-0">
          <FallbackImage
            src={imageUrl}
            alt={movie.title}
            fill
            className="object-cover transition-transform group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => {
              setImageError(true)
            }}
            priority={false}
            quality={85}
          />
          
          {/* Rating Badge */}
          <div className="absolute top-2 right-2 bg-black/80 text-white px-2 py-1 rounded-md text-sm font-semibold flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            {rating}%
          </div>
          
          {/* Overlay with actions */}
          {showActions && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button 
                size="icon" 
                variant="secondary" 
                className="rounded-full"
                onClick={handleWatchlistToggle}
                disabled={!user || isWatchlistLoadingState}
              >
                {isWatchlistLoadingState ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                ) : isInUserWatchlist ? (
                  <BookmarkCheck className="w-4 h-4 text-blue-600" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </Button>
              <Button 
                size="icon" 
                variant="secondary" 
                className="rounded-full"
                onClick={handleFavoritesToggle}
                disabled={!user || isFavoritesLoadingState}
              >
                {isFavoritesLoadingState ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                ) : (
                  <Heart className={cn(
                    "w-4 h-4",
                    isInUserFavorites ? "fill-red-500 text-red-500" : "text-gray-600"
                  )} />
                )}
              </Button>
            </div>
          )}
        </div>
        
        <CardContent className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-blue-600 transition-colors min-h-[3.5rem] flex items-start">
            <span className="leading-tight">
              {movie.title}
            </span>
          </h3>
          
          <p className="text-sm text-gray-600 mb-2 flex-shrink-0">
            {getReleaseYear(movie.release_date)}
          </p>
          
          <p className="text-sm text-gray-500 line-clamp-3 flex-1">
            {movie.overview}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
} 