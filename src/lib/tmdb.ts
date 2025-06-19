const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY
const TMDB_BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3'
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p' // Use hardcoded URL to avoid env var issues

class TMDBClient {
  private async fetchFromTMDB(endpoint: string, params?: Record<string, string>) {
    if (!TMDB_API_KEY) {
      console.error('TMDB API key is not set. Please add NEXT_PUBLIC_TMDB_API_KEY to your .env.local file')
      throw new Error('TMDB API key is not configured')
    }

    const url = new URL(`${TMDB_BASE_URL}${endpoint}`)
    url.searchParams.append('api_key', TMDB_API_KEY)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`)
    }
    
    return response.json()
  }

  // Get popular movies
  async getPopularMovies(page = 1) {
    return this.fetchFromTMDB('/movie/popular', { page: page.toString() })
  }

  // Get top rated movies
  async getTopRatedMovies(page = 1) {
    return this.fetchFromTMDB('/movie/top_rated', { page: page.toString() })
  }

  // Get now playing movies
  async getNowPlayingMovies(page = 1) {
    return this.fetchFromTMDB('/movie/now_playing', { page: page.toString() })
  }

  // Get upcoming movies
  async getUpcomingMovies(page = 1) {
    return this.fetchFromTMDB('/movie/upcoming', { page: page.toString() })
  }

  // Get trending movies
  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week') {
    return this.fetchFromTMDB(`/trending/movie/${timeWindow}`)
  }

  // Search movies
  async searchMovies(query: string, page = 1) {
    return this.fetchFromTMDB('/search/movie', { 
      query: encodeURIComponent(query), 
      page: page.toString() 
    })
  }

  // Get movie details
  async getMovieDetails(movieId: number) {
    return this.fetchFromTMDB(`/movie/${movieId}`, {
      append_to_response: 'credits,videos,reviews,similar'
    })
  }

  // Get movie genres
  async getGenres() {
    return this.fetchFromTMDB('/genre/movie/list')
  }

  // Discover movies with filters
  async discoverMovies(filters: {
    genre?: string
    year?: string
    rating?: string
    sortBy?: string
    page?: number
  }) {
    const params: Record<string, string> = {
      page: (filters.page || 1).toString()
    }

    if (filters.genre) params.with_genres = filters.genre
    if (filters.year) params.year = filters.year
    if (filters.rating) params['vote_average.gte'] = filters.rating
    if (filters.sortBy) params.sort_by = filters.sortBy

    return this.fetchFromTMDB('/discover/movie', params)
  }
}

export const tmdbClient = new TMDBClient()

// Helper functions for image URLs
export function getImageUrl(path: string | null, size: 'w200' | 'w300' | 'w500' | 'w780' | 'original' = 'w500') {
  if (!path || path === 'null' || path.trim() === '') {
    return null // Return null so components can show custom placeholders
  }
  
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const imageUrl = `${TMDB_IMAGE_BASE_URL}/${size}${cleanPath}`
  
  return imageUrl
}

export function getBackdropUrl(path: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280') {
  if (!path || path === 'null' || path.trim() === '') {
    return null // Return null so components can show custom placeholders
  }
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`
} 