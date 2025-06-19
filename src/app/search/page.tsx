'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Filter, X} from 'lucide-react'
import { Movie, TMDBResponse, Genre } from '@/types/movie'
import { tmdbClient } from '@/lib/tmdb'
import { MovieCard } from '@/components/movie-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''
  
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalResults, setTotalResults] = useState(0)
  const [searchTerm, setSearchTerm] = useState(query)
  const [genres, setGenres] = useState<Genre[]>([])
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [minRating, setMinRating] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  // Generate year options (current year back to 1950)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let year = currentYear; year >= 1950; year--) {
      years.push(year.toString())
    }
    return years
  }, [])

  // Fetch genres on component mount
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const genresData = await tmdbClient.getGenres()
        setGenres(genresData.genres)
      } catch (error) {
        console.error('Error fetching genres:', error)
      }
    }
    fetchGenres()
  }, [])

  // Search function
  const performSearch = async (searchQuery: string, page = 1, resetResults = true) => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const response: TMDBResponse<Movie> = await tmdbClient.searchMovies(searchQuery, page)
      
      if (resetResults) {
        setSearchResults(response.results)
        setCurrentPage(1)
      } else {
        setSearchResults(prev => [...prev, ...response.results])
        setCurrentPage(page)
      }
      
      setTotalPages(response.total_pages)
      setTotalResults(response.total_results)
    } catch (error) {
      console.error('Error searching movies:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initial search when query parameter changes
  useEffect(() => {
    if (query) {
      setSearchTerm(query)
      performSearch(query)
    }
  }, [query])

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`)
    }
  }

  // Load more results
  const loadMore = () => {
    if (currentPage < totalPages && !loading) {
      performSearch(query, currentPage + 1, false)
    }
  }

  // Filter results client-side for better UX
  const filteredResults = useMemo(() => {
    let filtered = searchResults

    if (selectedGenre) {
      filtered = filtered.filter(movie => 
        movie.genre_ids.includes(parseInt(selectedGenre))
      )
    }

    if (selectedYear) {
      filtered = filtered.filter(movie => 
        new Date(movie.release_date).getFullYear().toString() === selectedYear
      )
    }

    if (minRating) {
      filtered = filtered.filter(movie => 
        movie.vote_average >= parseFloat(minRating)
      )
    }

    return filtered
  }, [searchResults, selectedGenre, selectedYear, minRating])

  // Clear all filters
  const clearFilters = () => {
    setSelectedGenre('')
    setSelectedYear('')
    setMinRating('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Enhanced Search Header */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">🔍 Search Movies</h1>
            <p className="text-xl text-gray-300">Discover your next favorite film</p>
          </div>
          
          {/* Enhanced Search Form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative max-w-3xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for movies..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-12 pr-32 text-lg h-16 bg-white/10 backdrop-blur-xl border-white/20 text-white placeholder-gray-300 rounded-2xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              />
              <Button 
                type="submit" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300"
                disabled={loading}
              >
                Search
              </Button>
            </div>
          </form>

          {/* Enhanced Results Info */}
          {query && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div>
                <p className="text-gray-300 text-lg">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                      Searching...
                    </span>
                  ) : (
                    <>
                      {totalResults > 0 ? (
                        <>
                          Showing <span className="font-semibold text-blue-300">{filteredResults.length}</span> of{' '}
                          <span className="font-semibold text-blue-300">{totalResults.toLocaleString()}</span> results for{' '}
                          <span className="font-semibold text-white">&quot;{query}&quot;</span>
                        </>
                      ) : (
                        `No results found for "${query}"`
                      )}
                    </>
                  )}
                </p>
              </div>
              
              {/* Enhanced Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-xl rounded-xl"
              >
                <Filter className="w-4 h-4" />
                Filters
                {(selectedGenre || selectedYear || minRating) && (
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full">
                    {[selectedGenre, selectedYear, minRating].filter(Boolean).length}
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Enhanced Filters */}
        {showFilters && (
          <Card className="mb-8 bg-white/5 backdrop-blur-xl border-white/10 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Filters</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-gray-300 hover:text-white hover:bg-white/10 rounded-xl"
                >
                  Clear All
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Enhanced Genre Filter */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-300">Genre</label>
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white backdrop-blur-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  >
                    <option value="" className="bg-gray-800 text-white">All Genres</option>
                    {genres.map((genre) => (
                      <option key={genre.id} value={genre.id.toString()} className="bg-gray-800 text-white">
                        {genre.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Enhanced Year Filter */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-300">Release Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white backdrop-blur-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  >
                    <option value="" className="bg-gray-800 text-white">All Years</option>
                    {yearOptions.slice(0, 20).map((year) => (
                      <option key={year} value={year} className="bg-gray-800 text-white">
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Enhanced Rating Filter */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-300">Minimum Rating</label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white backdrop-blur-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  >
                    <option value="" className="bg-gray-800 text-white">Any Rating</option>
                    <option value="7" className="bg-gray-800 text-white">7+ Stars</option>
                    <option value="8" className="bg-gray-800 text-white">8+ Stars</option>
                    <option value="9" className="bg-gray-800 text-white">9+ Stars</option>
                  </select>
                </div>
              </div>

              {/* Enhanced Active Filters */}
              {(selectedGenre || selectedYear || minRating) && (
                <div className="mt-6 flex flex-wrap gap-3">
                  {selectedGenre && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 text-blue-300 rounded-xl text-sm backdrop-blur-xl">
                      {genres.find(g => g.id.toString() === selectedGenre)?.name}
                      <button onClick={() => setSelectedGenre('')} className="hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  )}
                  {selectedYear && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-400/30 text-green-300 rounded-xl text-sm backdrop-blur-xl">
                      {selectedYear}
                      <button onClick={() => setSelectedYear('')} className="hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  )}
                  {minRating && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 text-yellow-300 rounded-xl text-sm backdrop-blur-xl">
                      {minRating}+ Stars
                      <button onClick={() => setMinRating('')} className="hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Enhanced Loading State */}
        {loading && currentPage === 1 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-spin" style={{ clipPath: 'inset(0 0 50% 50%)' }}></div>
                <div className="absolute inset-2 rounded-full bg-gray-900"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Searching Movies</h2>
              <p className="text-gray-300">Finding the perfect films for you...</p>
            </div>
          </div>
        )}

        {/* Search Results */}
        {filteredResults.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12">
              {filteredResults.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>

            {/* Enhanced Load More Button */}
            {currentPage < totalPages && !loading && (
              <div className="text-center">
                <Button 
                  onClick={loadMore} 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 text-white font-semibold px-12 py-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl"
                >
                  Load More Movies
                </Button>
              </div>
            )}

            {/* Enhanced Loading More */}
            {loading && currentPage > 1 && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
              </div>
            )}
          </>
        ) : query && !loading ? (
          /* Enhanced No Results */
          <div className="text-center py-20">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 max-w-md mx-auto">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg w-fit mx-auto mb-6">
                <Search className="w-16 h-16" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">No movies found</h3>
              <p className="text-gray-300 mb-6">
                Try adjusting your search terms or filters
              </p>
              <Button 
                onClick={clearFilters} 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        ) : !query ? (
          /* Enhanced Search Prompt */
          <div className="text-center py-20">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 max-w-md mx-auto">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg w-fit mx-auto mb-6">
                <Search className="w-16 h-16" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Search for Movies</h3>
              <p className="text-gray-300">
                Enter a movie title, actor, director, or keyword to get started
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

// Loading component for Suspense fallback
function SearchLoading() {
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
        <h2 className="text-2xl font-bold text-white mb-2">Loading Search</h2>
        <p className="text-gray-300">Preparing your movie search...</p>
      </div>
    </div>
  )
}

// Main component wrapped in Suspense for SSR compatibility
export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchPageContent />
    </Suspense>
  )
} 