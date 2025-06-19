'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Play, AlertCircle, Star, TrendingUp, Calendar, Sparkles } from 'lucide-react'
import { Movie, Video } from '@/types/movie'
import { tmdbClient, getBackdropUrl } from '@/lib/tmdb'
import { MovieCard } from '@/components/movie-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TrailerModal } from '@/components/trailer-modal'
import { RecommendationsSection } from '@/components/recommendations-section'

export default function HomePage() {
  const [popularMovies, setPopularMovies] = useState<Movie[]>([])
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([])
  const [nowPlayingMovies, setNowPlayingMovies] = useState<Movie[]>([])
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([])
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null)
  const [heroTrailer, setHeroTrailer] = useState<Video | null>(null)
  const [showTrailerModal, setShowTrailerModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const [popular, topRated, nowPlaying, upcoming] = await Promise.all([
          tmdbClient.getPopularMovies(),
          tmdbClient.getTopRatedMovies(),
          tmdbClient.getNowPlayingMovies(),
          tmdbClient.getUpcomingMovies()
        ])

        setPopularMovies(popular.results.slice(0, 8))
        setTopRatedMovies(topRated.results.slice(0, 8))
        setNowPlayingMovies(nowPlaying.results.slice(0, 8))
        setUpcomingMovies(upcoming.results.slice(0, 8))
        
        const heroMovieData = popular.results[0]
        setHeroMovie(heroMovieData)

        // Fetch trailer for hero movie
        if (heroMovieData) {
          try {
            const movieDetails = await tmdbClient.getMovieDetails(heroMovieData.id)
            const trailer = movieDetails.videos.results.find(
              (video: Video) => video.type === 'Trailer' && video.site === 'YouTube'
            )
            setHeroTrailer(trailer || null)
          } catch (error) {
            console.error('Error fetching hero movie trailer:', error)
          }
        }
        
        setLoading(false)
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('Error fetching movies:', error)
          setError(error.message)
        } else {
          setError('Failed to fetch movies')
        }
        setLoading(false)
      }
    }

    fetchMovies()
  }, [])

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
          <h2 className="text-2xl font-bold text-white mb-2">Loading Your Cinematic Experience</h2>
          <p className="text-gray-300">Discovering amazing movies for you...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-purple-900 flex items-center justify-center">
        <Card className="max-w-md bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Configuration Required</h2>
            <p className="text-gray-300 mb-6">
              {error.includes('API key') ? (
                <>
                  Please add your TMDB API key to <code className="bg-gray-800/50 px-2 py-1 rounded text-blue-300">.env.local</code>
                  <br /><br />
                  1. Get your free API key from{' '}
                  <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                    TMDB
                  </a>
                  <br />
                  2. Add it as <code className="bg-gray-800/50 px-2 py-1 rounded text-blue-300">NEXT_PUBLIC_TMDB_API_KEY</code>
                </>
              ) : (
                error
              )}
            </p>
            <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Hero Section - Enhanced */}
      {heroMovie && (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Background with parallax effect */}
          <div className="absolute inset-0 scale-110">
            <div
              className="w-full h-full bg-cover bg-center transition-transform duration-1000 ease-out"
              style={{
                backgroundImage: `url(${getBackdropUrl(heroMovie.backdrop_path, 'original')})`
              }}
            />
          </div>
          
          {/* Sophisticated overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
          
          {/* Animated content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
            <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen py-20">
              
              {/* Text Content */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-blue-300 font-medium">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{heroMovie.vote_average.toFixed(1)}/10</span>
                    <span className="w-1 h-1 bg-blue-300 rounded-full" />
                    <span>Featured Movie</span>
                  </div>
                  
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                    <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                      {heroMovie.title}
                    </span>
                  </h1>

                  <p className="text-lg md:text-xl text-gray-200 max-w-2xl leading-relaxed">
                    {heroMovie.overview}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  {heroTrailer ? (
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 text-lg px-8 py-6 rounded-2xl transform hover:scale-105 transition-all duration-200 shadow-2xl"
                      onClick={() => setShowTrailerModal(true)}
                    >
                      <Play className="w-6 h-6 mr-3 fill-white" />
                      Watch Trailer
                    </Button>
                  ) : (
                    <Button size="lg" className="text-lg px-8 py-6 rounded-2xl" disabled>
                      <Play className="w-6 h-6 mr-3" />
                      No Trailer Available
                    </Button>
                  )}
                  
                  <Link href={`/movie/${heroMovie.id}`}>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="text-lg px-8 py-6 text-white border-2 border-white/30 hover:bg-white/10 backdrop-blur-sm rounded-2xl transform hover:scale-105 transition-all duration-200"
                    >
                      <Sparkles className="w-5 h-5 mr-3" />
                      Explore Details
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Movie Poster */}
              <div className="hidden lg:block relative">
                <div className="relative w-full max-w-md mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-3xl transform scale-110" />
                  <div className="relative aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
                    <img
                      src={`https://image.tmdb.org/t/p/w500${heroMovie.poster_path}`}
                      alt={heroMovie.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Content Sections */}
      <div className="relative bg-gradient-to-b from-transparent to-gray-900">
        {/* Recommendations Section */}
        <div className="relative z-10">
          <RecommendationsSection />
        </div>

        {/* Movie Categories Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
          
          {/* Enhanced Popular Movies */}
          <EnhancedMovieSection
            title="🔥 Popular Movies"
            subtitle="What everyone's watching right now"
            movies={popularMovies}
            viewAllLink="/category/popular"
            gradient="from-red-500 to-orange-500"
            icon={<TrendingUp className="w-8 h-8" />}
          />

          {/* Enhanced Top Rated */}
          <EnhancedMovieSection
            title="⭐ Top Rated Movies"
            subtitle="Critically acclaimed masterpieces"
            movies={topRatedMovies}
            viewAllLink="/category/top-rated"
            gradient="from-yellow-500 to-orange-500"
            icon={<Star className="w-8 h-8" />}
          />

          {/* Enhanced Now Playing */}
          <EnhancedMovieSection
            title="🎬 Now Playing"
            subtitle="In theaters near you"
            movies={nowPlayingMovies}
            viewAllLink="/category/now-playing"
            gradient="from-green-500 to-blue-500"
            icon={<Play className="w-8 h-8" />}
          />

          {/* Enhanced Upcoming */}
          <EnhancedMovieSection
            title="🗓️ Coming Soon"
            subtitle="Highly anticipated releases"
            movies={upcomingMovies}
            viewAllLink="/category/upcoming"
            gradient="from-purple-500 to-pink-500"
            icon={<Calendar className="w-8 h-8" />}
          />
        </div>
      </div>

      {/* Trailer Modal */}
      {heroTrailer && heroMovie && (
        <TrailerModal
          isOpen={showTrailerModal}
          onClose={() => setShowTrailerModal(false)}
          videoKey={heroTrailer.key}
          title={heroMovie.title}
        />
      )}
    </div>
  )
}

interface EnhancedMovieSectionProps {
  title: string
  subtitle: string
  movies: Movie[]
  viewAllLink: string
  gradient: string
  icon: React.ReactNode
}

function EnhancedMovieSection({ title, subtitle, movies, viewAllLink, gradient, icon }: EnhancedMovieSectionProps) {
  return (
    <section>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl bg-gradient-to-r ${gradient} text-white shadow-lg`}>
              {icon}
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">{title}</h2>
              <p className="text-gray-400 text-lg">{subtitle}</p>
            </div>
          </div>
        </div>
        
        <Link
          href={viewAllLink}
          className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl text-white font-medium transition-all duration-200 transform hover:scale-105"
        >
          View All
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
      
      {/* Movies Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  )
}


