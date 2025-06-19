'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bookmark, Trash2, Calendar, Star, Clock, Film } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useWatchlist } from '@/hooks/use-watchlist'
import { MovieCard } from '@/components/movie-card'
import { Button } from '@/components/ui/button'
import { AuthModal } from '@/components/auth-modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Pagination, ItemsPerPageSelector } from '@/components/ui/pagination'

export default function WatchlistPage() {
  const { user } = useAuth()
  const { watchlist, loading, removeFromWatchlist, isItemLoading } = useWatchlist()
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(24)

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user && !loading) {
      setShowAuthModal(true)
    }
  }, [user, loading])

  // Reset to page 1 when items per page changes
  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage])

  const handleRemoveFromWatchlist = async (movieId: number) => {
    const result = await removeFromWatchlist(movieId)
    if (result.error) {
      console.error('Error removing from watchlist:', result.error)
    }
  }

  // Convert watchlist items to Movie objects for MovieCard
  const watchlistMovies = watchlist.map(item => ({
    id: item.movie_id,
    title: item.movie_title,
    poster_path: item.movie_poster_path,
    release_date: item.movie_release_date || '',
    vote_average: item.movie_vote_average,
    overview: '', // Not stored in watchlist, will be fine for MovieCard
    backdrop_path: null,
    genre_ids: [],
    adult: false,
    original_language: '',
    original_title: item.movie_title,
    popularity: 0,
    video: false,
    vote_count: 0
  }))

  // Pagination calculations
  const totalItems = watchlistMovies.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentMovies = watchlistMovies.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg w-fit mx-auto mb-6">
              <Bookmark className="w-16 h-16" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">🔖 Sign In Required</h2>
            <p className="text-gray-300 mb-6">
              You need to sign in to view and manage your watchlist.
            </p>
            <Button 
              onClick={() => setShowAuthModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl"
            >
              Sign In to Continue
            </Button>
          </div>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode="login"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center gap-6 mb-6">
            <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-2xl">
              <Bookmark className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">🔖 My Watchlist</h1>
              <p className="text-xl md:text-2xl text-gray-300">Movies you want to watch</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-blue-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>{watchlist.length} movies in your watchlist</span>
            </div>
            {user && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Signed in as {user.user_metadata?.full_name || user.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-spin" style={{ clipPath: 'inset(0 0 50% 50%)' }}></div>
                <div className="absolute inset-2 rounded-full bg-gray-900"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Loading Watchlist</h2>
              <p className="text-gray-300">Gathering your movie queue...</p>
            </div>
          </div>
        ) : watchlist.length > 0 ? (
          <>
            {/* Enhanced Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Movies</CardTitle>
                  <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
                    <Film className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{watchlist.length}</div>
                  <p className="text-sm text-gray-400">movies to watch</p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10 rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-300">Highly Rated</CardTitle>
                  <div className="p-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {watchlist.filter(item => item.movie_vote_average >= 7).length}
                  </div>
                  <p className="text-sm text-gray-400">rated 7+ stars</p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10 rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-300">Recent Additions</CardTitle>
                  <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-blue-500">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {watchlist.filter(item => {
                      const releaseYear = item.movie_release_date ? new Date(item.movie_release_date).getFullYear() : 0
                      return releaseYear >= new Date().getFullYear() - 2
                    }).length}
                  </div>
                  <p className="text-sm text-gray-400">recent releases</p>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
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

            {/* Enhanced Movies Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12">
              {currentMovies.map((movie) => (
                <div key={movie.id} className="relative group">
                  <MovieCard movie={movie} showActions={false} />
                  
                  {/* Enhanced Remove Button Overlay */}
                  <div className="absolute top-3 left-3 z-10">
                    <Button
                      size="icon"
                      variant="destructive"
                      className="w-10 h-10 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 bg-red-600/90 hover:bg-red-700 backdrop-blur-xl border border-red-500/30 shadow-lg"
                      onClick={() => handleRemoveFromWatchlist(movie.id)}
                      disabled={isItemLoading(movie.id)}
                    >
                      {isItemLoading(movie.id) ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Enhanced Added Date */}
                  <div className="mt-3 text-xs text-gray-400 text-center bg-white/5 backdrop-blur-xl rounded-lg p-2 border border-white/10">
                    Added {new Date(watchlist.find(item => item.movie_id === movie.id)?.added_at || '').toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="mb-12">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            )}
          </>
        ) : (
          /* Enhanced Empty State */
          <div className="text-center py-20">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-16 border border-white/10 max-w-2xl mx-auto">
              <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg w-fit mx-auto mb-8">
                <Bookmark className="w-24 h-24" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-6">Your watchlist is empty</h3>
              <p className="text-gray-300 mb-12 text-lg max-w-md mx-auto">
                Start building your watchlist by browsing movies and clicking the bookmark icon on movies you want to watch.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/category/popular">
                  <Button className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl">
                    <Star className="w-5 h-5 mr-2" />
                    Browse Popular Movies
                  </Button>
                </Link>
                <Link href="/category/upcoming">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl">
                    <Calendar className="w-5 h-5 mr-2" />
                    Check Upcoming Movies
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 