'use client'

import { useEffect, useState } from 'react'
import { Heart, Trash2, Film, BarChart3, Star } from 'lucide-react'
import { MovieCard } from '@/components/movie-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useFavorites } from '@/hooks/use-favorites'
import { Pagination, ItemsPerPageSelector } from '@/components/ui/pagination'
import Link from 'next/link'

export default function FavoritesPage() {
  const { user } = useAuth()
  const { favorites, loading, initialized, removeFromFavorites, refetch } = useFavorites()
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(24)

  // Reset to page 1 when items per page changes
  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage])

  // If user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-purple-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg w-fit mx-auto mb-6">
              <Heart className="w-16 h-16" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">❤️ My Favorites</h1>
            <p className="text-gray-300 mb-6">Please sign in to view your favorite movies.</p>
            <Button 
              asChild
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 rounded-xl"
            >
              <Link href="/">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Loading state - only show if not initialized
  if (!initialized && loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-400 to-pink-500 animate-spin" style={{ clipPath: 'inset(0 0 50% 50%)' }}></div>
            <div className="absolute inset-2 rounded-full bg-gray-900"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-red-400 to-pink-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Favorites</h2>
          <p className="text-gray-300">Gathering your movie collection...</p>
        </div>
      </div>
    )
  }

  // Empty state - only show if user is authenticated and initialized
  if (user && initialized && favorites.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-purple-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg w-fit mx-auto mb-6">
              <Heart className="w-16 h-16" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">❤️ My Favorites</h1>
            <p className="text-gray-300 mb-6">
              You haven&apos;t added any movies to your favorites yet.
            </p>
            <Button 
              asChild
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 rounded-xl"
            >
              <Link href="/">Discover Movies</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Calculate some basic stats
  const averageRating = favorites.reduce((sum, item) => sum + item.movie_vote_average, 0) / favorites.length
  const totalMovies = favorites.length

  // Pagination calculations
  const totalItems = favorites.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentFavorites = favorites.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
  }

  const handleRemoveFromFavorites = async (movieId: number) => {
    const result = await removeFromFavorites(movieId)
    if (result.error) {
      console.error('Error removing from favorites:', result.error)
    }
  }

  // Only render content if initialized
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-400 to-pink-500 animate-spin" style={{ clipPath: 'inset(0 0 50% 50%)' }}></div>
            <div className="absolute inset-2 rounded-full bg-gray-900"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-red-400 to-pink-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Favorites</h2>
          <p className="text-gray-300">Gathering your movie collection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-purple-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Enhanced Header */}
        <div className="mb-12">
          <div className="flex items-center gap-6 mb-6">
            <div className="p-4 rounded-3xl bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-2xl">
              <Heart className="w-12 h-12 fill-current" />
            </div>
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">❤️ My Favorites</h1>
              <p className="text-xl text-gray-300">
                Your collection of favorite movies - {totalMovies} {totalMovies === 1 ? 'movie' : 'movies'}
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-300">Total Favorites</CardTitle>
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
                <Film className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalMovies}</div>
              <p className="text-sm text-gray-400">
                {totalMovies > 1 ? 'movies' : 'movie'} in your collection
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-300">Average Rating</CardTitle>
              <div className="p-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500">
                <Star className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{averageRating.toFixed(1)}/10</div>
              <p className="text-sm text-gray-400">
                Based on TMDB ratings
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-300">Collection Score</CardTitle>
              <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-blue-500">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{Math.round(averageRating * 10)}%</div>
              <p className="text-sm text-gray-400">
                Quality score of your taste
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Favorites Grid Section */}
        <div className="space-y-8">
          <div className="flex items-center justify-between bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white">Your Favorite Movies</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              disabled={loading}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-xl rounded-xl"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          {/* Enhanced Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <ItemsPerPageSelector
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
            
            {totalPages > 1 && (
              <div className="text-sm text-gray-300">
                Page {currentPage} of {totalPages}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {currentFavorites.map((item) => {
              // Convert the favorite item back to a Movie object for the MovieCard
              const movie = {
                id: item.movie_id,
                title: item.movie_title,
                poster_path: item.movie_poster_path,
                backdrop_path: null,
                release_date: item.movie_release_date || '',
                vote_average: item.movie_vote_average,
                vote_count: 0,
                overview: '', // We don't store overview in favorites
                adult: false,
                genre_ids: [],
                original_language: 'en',
                original_title: item.movie_title,
                popularity: 0,
                video: false,
              }
              
              return (
                <div key={item.id} className="relative group">
                  <MovieCard 
                    movie={movie} 
                    showActions={false} // Disable the overlay actions since we're showing a remove button
                  />
                  
                  {/* Enhanced Remove button */}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-red-600/90 hover:bg-red-700 backdrop-blur-xl rounded-xl border border-red-500/30 shadow-lg"
                    onClick={() => handleRemoveFromFavorites(item.movie_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  
                  {/* Enhanced Added date */}
                  <div className="mt-3 text-xs text-gray-400 text-center bg-white/5 backdrop-blur-xl rounded-lg p-2 border border-white/10">
                    Added {new Date(item.added_at).toLocaleDateString()}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="mt-12">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 