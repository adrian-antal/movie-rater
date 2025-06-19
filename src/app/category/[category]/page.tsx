'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Star, TrendingUp, Calendar, Film } from 'lucide-react'
import { Movie } from '@/types/movie'
import { tmdbClient } from '@/lib/tmdb'
import { MovieCard } from '@/components/movie-card'
import { Button } from '@/components/ui/button'

const categoryConfig = {
  'popular': {
    title: '🔥 Popular Movies',
    description: 'Discover the most popular movies right now',
    icon: TrendingUp,
    gradient: 'from-red-500 to-orange-500',
    fetchFunction: (page: number) => tmdbClient.getPopularMovies(page)
  },
  'top-rated': {
    title: '⭐ Top Rated Movies',
    description: 'The highest rated movies of all time',
    icon: Star,
    gradient: 'from-yellow-500 to-orange-500',
    fetchFunction: (page: number) => tmdbClient.getTopRatedMovies(page)
  },
  'now-playing': {
    title: '🎬 Now Playing',
    description: 'Movies currently playing in theaters',
    icon: Film,
    gradient: 'from-green-500 to-blue-500',
    fetchFunction: (page: number) => tmdbClient.getNowPlayingMovies(page)
  },
  'upcoming': {
    title: '🗓️ Upcoming Movies',
    description: 'Coming soon to theaters',
    icon: Calendar,
    gradient: 'from-purple-500 to-pink-500',
    fetchFunction: (page: number) => tmdbClient.getUpcomingMovies(page)
  }
}

export default function CategoryPage() {
  const { category } = useParams()
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const categoryKey = category as keyof typeof categoryConfig
  const config = categoryConfig[categoryKey]

  useEffect(() => {
    if (!config) {
      setError('Category not found')
      setLoading(false)
      return
    }

    const fetchMovies = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await config.fetchFunction(1)
        setMovies(response.results)
        setTotalPages(response.total_pages)
        setCurrentPage(1)
      } catch (err) {
        setError('Failed to load movies')
        console.error('Error fetching movies:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMovies()
  }, [category, config])

  const loadMoreMovies = async () => {
    if (currentPage >= totalPages || loadingMore) return

    try {
      setLoadingMore(true)
      const response = await config.fetchFunction(currentPage + 1)
      setMovies(prev => [...prev, ...response.results])
      setCurrentPage(prev => prev + 1)
    } catch (err) {
      console.error('Error loading more movies:', err)
    } finally {
      setLoadingMore(false)
    }
  }

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
          <h2 className="text-2xl font-bold text-white mb-2">Loading Movies</h2>
          <p className="text-gray-300">Discovering amazing content for you...</p>
        </div>
      </div>
    )
  }

  if (error || !config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-purple-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
            <h1 className="text-3xl font-bold text-white mb-4">
              {error || 'Category Not Found'}
            </h1>
            <p className="text-gray-300 mb-6">
              {error || 'The category you are looking for does not exist.'}
            </p>
            <Button 
              onClick={() => window.history.back()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const IconComponent = config.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center gap-6 mb-6">
            <div className={`p-4 rounded-3xl bg-gradient-to-r ${config.gradient} text-white shadow-2xl`}>
              <IconComponent className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">{config.title}</h1>
              <p className="text-xl md:text-2xl text-gray-300">{config.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-blue-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Total Movies: {movies.length}+</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Page {currentPage} of {totalPages}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Movies Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {movies.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>

            {/* Enhanced Load More Button */}
            {currentPage < totalPages && (
              <div className="text-center">
                <Button
                  onClick={loadMoreMovies}
                  disabled={loadingMore}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 text-white font-semibold px-12 py-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Loading More Movies...
                    </>
                  ) : (
                    'Load More Movies'
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 max-w-md mx-auto">
              <div className={`p-4 rounded-2xl bg-gradient-to-r ${config.gradient} text-white shadow-lg w-fit mx-auto mb-6`}>
                <IconComponent className="w-16 h-16" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">No Movies Found</h3>
              <p className="text-gray-300">
                We couldn&apos;t find any movies in this category at the moment.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 