'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Menu, X, Star, ImageIcon, LogOut, Bookmark, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { tmdbClient, getImageUrl } from '@/lib/tmdb'
import { Movie } from '@/types/movie'
import { AuthModal } from '@/components/auth-modal'
import { useAuth } from '@/contexts/auth-context'
import Image from 'next/image'

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<Movie[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const { user, signOut } = useAuth()

  // Debounced search for suggestions
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim() && searchQuery.length >= 2) {
        setIsSearching(true)
        try {
          const results = await tmdbClient.searchMovies(searchQuery.trim(), 1)
          setSearchSuggestions(results.results.slice(0, 8)) // Show top 8 suggestions
          setImageErrors(new Set()) // Reset image errors for new search
          setShowSuggestions(true)
        } catch (error) {
          console.error('Search suggestions error:', error)
          setSearchSuggestions([])
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [searchQuery])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setShowSuggestions(false)
      setSearchQuery('')
      inputRef.current?.blur()
    }
  }

  const handleSuggestionClick = (movie: Movie) => {
    router.push(`/movie/${movie.id}`)
    setShowSuggestions(false)
    setSearchQuery('')
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  const handleImageError = (movieId: number) => {
    setImageErrors(prev => new Set(prev).add(movieId))
  }

  const handleAuthClick = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setShowAuthModal(true)
  }

  const handleSignOut = async () => {
    await signOut()
    setShowUserMenu(false)
  }

  // Movie poster placeholder component
  const MoviePosterPlaceholder = () => (
    <div className="w-12 h-16 bg-gray-700 rounded flex flex-col items-center justify-center text-gray-400">
      <ImageIcon className="w-4 h-4 mb-1" />
      <span className="text-xs">No Image</span>
    </div>
  )

  // User avatar component
  const UserAvatar = () => (
    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
      {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
    </div>
  )

  return (
    <>
      <nav className="bg-gray-900/95 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="relative w-10 h-10">
                <Image
                  src="/movie-rater-logo.png"
                  alt="MovieRater Logo"
                  fill
                  className="object-contain"
                  sizes="40px"
                />
              </div>
              <span className="text-xl font-bold text-white">MovieRater</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/category/popular" className="text-gray-300 hover:text-blue-400 transition-colors font-medium">
                Popular
              </Link>
              <Link href="/category/top-rated" className="text-gray-300 hover:text-yellow-400 transition-colors font-medium">
                Top Rated
              </Link>
              <Link href="/category/now-playing" className="text-gray-300 hover:text-green-400 transition-colors font-medium">
                Now Playing
              </Link>
              <Link href="/category/upcoming" className="text-gray-300 hover:text-purple-400 transition-colors font-medium">
                Upcoming
              </Link>
            </div>

            {/* Search */}
            <div className="hidden md:block relative" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search movies..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                  className="w-80 pl-10 pr-4 bg-white/10 backdrop-blur-xl border-white/20 text-white placeholder-gray-400 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </form>

              {/* Search Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl max-h-96 overflow-y-auto z-50">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-300">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto"></div>
                    </div>
                  ) : searchSuggestions.length > 0 ? (
                    <>
                      {searchSuggestions.map((movie) => {
                        const posterUrl = getImageUrl(movie.poster_path, 'w200')
                        const hasImageError = imageErrors.has(movie.id)
                        
                        return (
                          <button
                            key={movie.id}
                            onClick={() => handleSuggestionClick(movie)}
                            className="w-full p-3 text-left hover:bg-white/10 border-b border-white/10 last:border-b-0 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              {/* Movie Poster Thumbnail */}
                              <div className="flex-shrink-0">
                                {hasImageError || !posterUrl ? (
                                  <MoviePosterPlaceholder />
                                ) : (
                                  <div className="relative w-12 h-16 rounded overflow-hidden bg-gray-700">
                                    <Image
                                      src={posterUrl}
                                      alt={movie.title}
                                      fill
                                      className="object-cover"
                                      sizes="48px"
                                      onError={() => handleImageError(movie.id)}
                                    />
                                  </div>
                                )}
                              </div>
                              
                              {/* Movie Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  {movie.title}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-xs text-gray-400">
                                    {new Date(movie.release_date).getFullYear() || 'TBA'}
                                  </span>
                                  {movie.vote_average > 0 && (
                                    <div className="flex items-center space-x-1">
                                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                      <span className="text-xs text-gray-400">
                                        {movie.vote_average.toFixed(1)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                      <div className="p-3 border-t border-white/10 bg-white/5">
                        <button
                          onClick={handleSearch}
                          className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                        >
                          See all results for &quot;{searchQuery}&quot;
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-center text-gray-400">
                      No movies found for &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white hover:bg-white/10"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>

            {/* User Actions (Desktop) */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <UserAvatar />
                    <span className="text-sm font-medium text-white">
                      {user.user_metadata?.full_name || user.email}
                    </span>
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50">
                      <Link
                        href="/watchlist"
                        className="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors rounded-t-xl"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Bookmark className="w-4 h-4 mr-3 text-blue-400" />
                        My Watchlist
                      </Link>
                      <Link
                        href="/favorites"
                        className="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Heart className="w-4 h-4 mr-3 text-red-400" />
                        My Favorites
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors rounded-b-xl"
                      >
                        <LogOut className="w-4 h-4 mr-3 text-gray-400" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleAuthClick('login')}
                    className="text-white hover:bg-white/10 rounded-xl"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => handleAuthClick('signup')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl"
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-white/10 py-4">
              <div className="space-y-4">
                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="relative">
                  <Input
                    type="text"
                    placeholder="Search movies..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 bg-white/10 backdrop-blur-xl border-white/20 text-white placeholder-gray-400 rounded-xl"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </form>

                {/* Mobile Navigation Links */}
                <div className="space-y-2">
                  <Link
                    href="/category/popular"
                    className="block py-2 text-gray-300 hover:text-blue-400 transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Popular
                  </Link>
                  <Link
                    href="/category/top-rated"
                    className="block py-2 text-gray-300 hover:text-yellow-400 transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Top Rated
                  </Link>
                  <Link
                    href="/category/now-playing"
                    className="block py-2 text-gray-300 hover:text-green-400 transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Now Playing
                  </Link>
                  <Link
                    href="/category/upcoming"
                    className="block py-2 text-gray-300 hover:text-purple-400 transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Upcoming
                  </Link>
                </div>

                {/* Mobile User Actions */}
                <div className="space-y-2 pt-4 border-t border-white/10">
                  {user ? (
                    <>
                      <Link
                        href="/watchlist"
                        className="flex items-center py-2 text-gray-300 hover:text-blue-400 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Bookmark className="w-4 h-4 mr-2" />
                        My Watchlist
                      </Link>
                      <Link
                        href="/favorites"
                        className="flex items-center py-2 text-gray-300 hover:text-red-400 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        My Favorites
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full text-left py-2 text-gray-300 hover:text-gray-100 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-white hover:bg-white/10"
                        onClick={() => handleAuthClick('login')}
                      >
                        Sign In
                      </Button>
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        onClick={() => handleAuthClick('signup')}
                      >
                        Sign Up
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  )
} 