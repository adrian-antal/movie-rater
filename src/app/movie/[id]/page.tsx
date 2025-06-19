'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Clock, Star, Play, Heart, Bookmark, BookmarkCheck, Users, Camera, ImageIcon, Film } from 'lucide-react'
import { MovieDetails, CastMember, CrewMember, Video } from '@/types/movie'
import { tmdbClient, getImageUrl, getBackdropUrl } from '@/lib/tmdb'
import { formatDate, formatRuntime, formatRating } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MovieCard } from '@/components/movie-card'
import { TrailerModal } from '@/components/trailer-modal'
import { useAuth } from '@/contexts/auth-context'
import { useWatchlist } from '@/hooks/use-watchlist'
import { useFavorites } from '@/hooks/use-favorites'

export default function MovieDetailPage() {
  const { id } = useParams()
  const [movie, setMovie] = useState<MovieDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [backdropError, setBackdropError] = useState(false)
  const [posterError, setPosterError] = useState(false)
  const [showTrailerModal, setShowTrailerModal] = useState(false)
  const { user } = useAuth()
  const { isInWatchlist, toggleWatchlist, isItemLoading } = useWatchlist()
  const { isInFavorites, toggleFavorites, isItemLoading: isFavoritesLoading } = useFavorites()

  // Scroll to top when movie page loads (but preserve back navigation)
  useEffect(() => {
    // Only scroll to top if this is NOT a back/forward navigation
    const perfEntries = performance.getEntriesByType('navigation');
    const navEntry = perfEntries[0] as PerformanceNavigationTiming;
    
    // Check if it's a back/forward navigation or if the page was loaded from cache
    const isBackNavigation = navEntry && (
      navEntry.type === 'back_forward' || 
      navEntry.transferSize === 0
    )
    
    if (!isBackNavigation) {
      // This is a fresh navigation (clicking a link), scroll to top
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
    }
  }, [id])

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true)
        const movieData = await tmdbClient.getMovieDetails(Number(id))
        setMovie(movieData)
      } catch (err) {
        setError('Failed to load movie details')
        console.error('Error fetching movie:', err)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchMovie()
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-spin" style={{ clipPath: 'inset(0 0 50% 50%)' }}></div>
            <div className="absolute inset-2 rounded-full bg-gray-900"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Movie</h2>
          <p className="text-gray-300">Getting movie details...</p>
        </div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-purple-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg w-fit mx-auto mb-6">
              <Film className="w-16 h-16" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Movie Not Found</h1>
            <p className="text-gray-300 mb-6">{error || 'The movie you are looking for does not exist.'}</p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl">
                Go Back Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const mainTrailer = movie.videos.results.find(
    (video: Video) => video.type === 'Trailer' && video.site === 'YouTube'
  )

  const director = movie.credits.crew.find((person: CrewMember) => person.job === 'Director')
  const writers = movie.credits.crew.filter((person: CrewMember) => 
    person.job === 'Writer' || person.job === 'Screenplay' || person.job === 'Story'
  ).slice(0, 3)

  // Backdrop placeholder component
  const BackdropPlaceholder = () => (
    <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-600 flex items-center justify-center">
      <div className="text-center text-white/60">
        <ImageIcon className="w-24 h-24 mx-auto mb-4" />
        <p className="text-lg">No backdrop available</p>
      </div>
    </div>
  )

  // Poster placeholder component
  const PosterPlaceholder = () => (
    <div className="w-48 md:w-72 aspect-[2/3] bg-gray-800 rounded-2xl shadow-2xl flex flex-col items-center justify-center text-gray-300 border border-white/20">
      <ImageIcon className="w-16 h-16 mb-2" />
      <span className="text-sm font-medium">No Poster</span>
      <span className="text-xs">Available</span>
    </div>
  )

  const backdropUrl = getBackdropUrl(movie.backdrop_path, 'original')
  const posterUrl = getImageUrl(movie.poster_path, 'w500')

  const handleWatchlistToggle = async () => {
    if (!user || !movie) return

    const result = await toggleWatchlist(movie)
    if (result.error) {
      console.error('Error toggling watchlist:', result.error)
    }
  }

  const handleFavoritesToggle = async () => {
    if (!user || !movie) return

    const result = await toggleFavorites(movie)
    if (result.error) {
      console.error('Error toggling favorites:', result.error)
    }
  }

  const isInUserWatchlist = user ? isInWatchlist(movie.id) : false
  const isInUserFavorites = user ? isInFavorites(movie.id) : false
  const isWatchlistLoading = isItemLoading(movie.id)
  const isFavoritesLoadingState = isFavoritesLoading(movie.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Hero Section */}
      <div className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        {backdropError || !backdropUrl ? (
          <BackdropPlaceholder />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${backdropUrl})`
            }}
            onError={() => setBackdropError(true)}
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="relative z-10 h-full flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="flex flex-col md:flex-row gap-8 items-end">
              {/* Movie Poster */}
              <div className="flex-shrink-0">
                {posterError || !posterUrl ? (
                  <PosterPlaceholder />
                ) : (
                  <Image
                    src={posterUrl!}
                    alt={movie.title}
                    width={300}
                    height={450}
                    className="rounded-2xl shadow-2xl w-48 md:w-72 border border-white/20"
                    onError={() => setPosterError(true)}
                  />
                )}
              </div>
              
              {/* Movie Info */}
              <div className="text-white flex-1">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">{movie.title}</h1>
                {movie.tagline && (
                  <p className="text-xl md:text-2xl italic mb-6 text-gray-300 font-light">{movie.tagline}</p>
                )}
                
                <div className="flex flex-wrap items-center gap-6 mb-6">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/20">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-semibold">{formatRating(movie.vote_average)}%</span>
                    <span className="text-gray-300 text-sm">({movie.vote_count.toLocaleString()} votes)</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/20">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <span>{formatDate(movie.release_date)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/20">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <span>{formatRuntime(movie.runtime)}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 mb-8">
                  {movie.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-xl text-sm border border-blue-400/30 text-blue-300"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-4">
                  {mainTrailer && (
                    <Button 
                      size="lg" 
                      className="text-lg bg-gradient-to-r from-red-600 via-pink-600 to-red-700 hover:from-red-700 hover:via-pink-700 hover:to-red-800 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl"
                      onClick={() => setShowTrailerModal(true)}
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Watch Trailer
                    </Button>
                  )}
                  <Button 
                    size="lg" 
                    className="bg-white/10 backdrop-blur-xl border-2 border-white/30 text-white hover:bg-white/20 font-semibold px-8 py-4 rounded-2xl transition-all duration-300"
                    onClick={handleFavoritesToggle}
                    disabled={!user || isFavoritesLoadingState}
                  >
                    {isFavoritesLoadingState ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Loading...
                      </>
                    ) : isInUserFavorites ? (
                      <>
                        <Heart className="w-5 h-5 mr-2 fill-red-500 text-red-500" />
                        Remove from Favorites
                      </>
                    ) : (
                      <>
                        <Heart className="w-5 h-5 mr-2" />
                        Add to Favorites
                      </>
                    )}
                  </Button>
                  <Button 
                    size="lg" 
                    className="bg-white/10 backdrop-blur-xl border-2 border-white/30 text-white hover:bg-white/20 font-semibold px-8 py-4 rounded-2xl transition-all duration-300"
                    onClick={handleWatchlistToggle}
                    disabled={!user || isWatchlistLoading}
                  >
                    {isWatchlistLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Loading...
                      </>
                    ) : isInUserWatchlist ? (
                      <>
                        <BookmarkCheck className="w-5 h-5 mr-2" />
                        In Watchlist
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-5 h-5 mr-2" />
                        Add to Watchlist
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        
        {/* Enhanced Overview */}
        <section className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
          <h2 className="text-3xl font-bold mb-6 text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
            Overview
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed mb-8 font-light">{movie.overview}</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {director && (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-400" />
                  Director
                </h3>
                <p className="text-gray-300">{director.name}</p>
              </div>
            )}
            
            {writers.length > 0 && (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Writers
                </h3>
                <p className="text-gray-300">{writers.map(w => w.name).join(', ')}</p>
              </div>
            )}
            
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                Budget
              </h3>
              <p className="text-gray-300">
                {movie.budget > 0 ? `$${movie.budget.toLocaleString()}` : 'Not disclosed'}
              </p>
            </div>
          </div>
        </section>

        {/* Enhanced Cast */}
        <section>
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold mb-8 text-white flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-blue-500">
                <Users className="w-6 h-6 text-white" />
              </div>
              Cast
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {movie.credits.cast.slice(0, 12).map((actor: CastMember) => {
                const actorImageUrl = getImageUrl(actor.profile_path, 'w300')
                return (
                  <Card key={actor.id} className="overflow-hidden bg-white/10 backdrop-blur-xl border-white/20 rounded-2xl">
                    <div className="aspect-[3/4] relative bg-gray-800">
                      {actorImageUrl ? (
                        <Image
                          src={actorImageUrl}
                          alt={actor.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <Users className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-white text-sm line-clamp-2">{actor.name}</h3>
                      <p className="text-gray-400 text-xs mt-1 line-clamp-2">{actor.character}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Enhanced Similar Movies */}
        {movie.similar.results.length > 0 && (
          <section>
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
              <h2 className="text-3xl font-bold mb-8 text-white flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500">
                  <Film className="w-6 h-6 text-white" />
                </div>
                Similar Movies
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {movie.similar.results.slice(0, 6).map((similarMovie) => (
                  <MovieCard key={similarMovie.id} movie={similarMovie} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Enhanced Reviews */}
        {movie.reviews.results.length > 0 && (
          <section>
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
              <h2 className="text-3xl font-bold mb-8 text-white flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                  <Star className="w-6 h-6 text-white" />
                </div>
                Reviews
              </h2>
              <div className="space-y-6">
                {movie.reviews.results.slice(0, 3).map((review) => (
                  <Card key={review.id} className="bg-white/10 backdrop-blur-xl border-white/20 rounded-2xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {review.author.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-lg text-white">{review.author}</p>
                          {review.author_details.rating && (
                            <div className="flex items-center gap-2 mt-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-gray-300">{review.author_details.rating}/10</span>
                            </div>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 line-clamp-4 leading-relaxed">{review.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Trailer Modal */}
      {mainTrailer && (
        <TrailerModal
          isOpen={showTrailerModal}
          onClose={() => setShowTrailerModal(false)}
          videoKey={mainTrailer.key}
          title={movie.title}
        />
      )}
    </div>
  )
} 