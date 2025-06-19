import { supabase } from './supabase'
import { tmdbClient } from './tmdb'
import { Movie } from '@/types/movie'

interface UserPreference {
  genre_id: number
  preference_score: number
}

interface Recommendation {
  movie_id: number
  score: number
  reason: string
  type: 'content' | 'collaborative' | 'trending' | 'similar_cast' | 'similar_director'
}

interface UserFavorite {
  movie_id: number
  movie_title: string
}

interface UserWatchlistItem {
  movie_id: number
  movie_title: string
}

interface TMDBMovie {
  id: number
  title: string
  genre_ids: number[]
  popularity: number
  vote_average: number
  release_date: string
}

interface TMDBGenre {
  id: number
  name: string
}

interface TMDBCredits {
  cast: Array<{ id: number; name: string }>
  crew: Array<{ id: number; name: string; job: string }>
}

interface TMDBMovieDetails extends TMDBMovie {
  genres: TMDBGenre[]
  runtime: number
  credits?: TMDBCredits
}

export class RecommendationEngine {
  
  /**
   * Generate personalized recommendations for a user
   */
  static async generateRecommendations(userId: string, limit: number = 20): Promise<Movie[]> {
    try {
      // 1. Get user's preferences and behavior
      const userPreferences = await this.getUserPreferences(userId)
      const userFavorites = await this.getUserFavorites(userId)
      const userWatchlist = await this.getUserWatchlist(userId)
      
      // 2. Generate different types of recommendations
      const contentRecs = await this.getContentBasedRecommendations(userId, userPreferences, userFavorites)
      const collaborativeRecs = await this.getCollaborativeRecommendations(userId, userFavorites)
      const trendingRecs = await this.getTrendingRecommendations(userPreferences)
      
      console.log('DEBUG - Content recommendations:', contentRecs.length)
      console.log('DEBUG - Collaborative recommendations:', collaborativeRecs.length)
      console.log('DEBUG - Trending recommendations:', trendingRecs.length)
      
      // 4. If we have some content/collaborative but not enough, supplement with genre-based
      const personalizedRecs = [...contentRecs, ...collaborativeRecs]
      
      if (personalizedRecs.length > 0 && personalizedRecs.length < limit && userPreferences.length > 0) {
        const supplementNeeded = limit - personalizedRecs.length
        
        // Create set of movie IDs already in personalized recommendations
        const personalizedMovieIds = new Set(personalizedRecs.map(rec => rec.movie_id))
        const allExistingIds = new Set([
          ...userFavorites.map(f => f.movie_id),
          ...userWatchlist.map(w => w.movie_id),
          ...personalizedMovieIds // Also exclude movies already in personalized recs
        ])
        
        const genreSupplements = await this.getIntelligentGenreFallbackWithExclusions(
          userPreferences, 
          allExistingIds, 
          supplementNeeded
        )
        
        // Convert TMDB movies to Recommendation format
        const genreRecs: Recommendation[] = genreSupplements.map((movie: Movie) => ({
          movie_id: movie.id,
          score: 0.5, // Medium score so they appear after personalized but before trending
          reason: 'Based on your genre preferences',
          type: 'content' as const
        }))
        
        // Combine ONLY personalized + genre-based (no trending)
        const supplementedRecommendations = this.combineRecommendations([
          ...personalizedRecs,
          ...genreRecs
          // Removed trendingRecs - use only personalized + genre-based
        ])
        
        console.log(`DEBUG - Before filtering: ${supplementedRecommendations.length} total recommendations`)
        
        return await this.finalizeRecommendations(supplementedRecommendations, userFavorites, userWatchlist, limit, userId)
      }
      
      // 5. If only trending recommendations (no personalized content), use intelligent fallback
      if (contentRecs.length === 0 && collaborativeRecs.length === 0 && userPreferences.length > 0) {
        console.log('No personalized recommendations found, using intelligent genre-based fallback')
        return await this.getIntelligentGenreFallback(userPreferences, userFavorites, userWatchlist, limit)
      }
      
      // 3. Combine and score recommendations (for cases with enough personalized content)
      const allRecommendations = this.combineRecommendations([
        ...contentRecs,
        ...collaborativeRecs,
        ...trendingRecs
      ])

      // 6. If no recommendations at all, fallback to trending
      if (allRecommendations.length === 0) {
        console.log('No recommendations found, falling back to simple trending')
        return await this.getSimpleTrendingFallback(userFavorites, userWatchlist, limit)
      }
      
      console.log('Using combined recommendations from algorithms')
      
      return await this.finalizeRecommendations(allRecommendations, userFavorites, userWatchlist, limit, userId)
    } catch (error) {
      console.error('Error generating recommendations:', error)
      // Fallback to simple trending if everything fails
      return await this.getSimpleTrendingFallback([], [], limit)
    }
  }

  /**
   * Content-based recommendations: movies similar to user's favorites
   */
  private static async getContentBasedRecommendations(
    userId: string, 
    preferences: UserPreference[], 
    favorites: UserFavorite[]
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []
    
    // Get user's preferred genres (be less restrictive to find more movies)
    const topGenres = preferences
      .filter(p => p.preference_score > 0.1) // Lower threshold
      .sort((a, b) => b.preference_score - a.preference_score)
      .slice(0, 5) // Include more genres

    for (const genre of topGenres) {
      try {
        // Find movies in preferred genres (lower quality threshold)
        const { data: movies, error } = await supabase
          .from('movie_features')
          .select('*')
          .contains('genres', [genre.genre_id])
          .gte('vote_average', 5.0) // Lower threshold to find more movies
          .order('popularity_score', { ascending: false })
          .limit(15) // Get more movies per genre
        
        if (movies && !error) {
          movies.forEach(movie => {
            const score = genre.preference_score * (movie.vote_average / 10) * (movie.popularity_score / 100)
            recommendations.push({
              movie_id: movie.movie_id,
              score,
              reason: `Because you like ${this.getGenreName(genre.genre_id)} movies`,
              type: 'content'
            })
          })
        }
      } catch (error) {
        console.error(`Error fetching movies for genre ${genre.genre_id}:`, error)
        // Continue with other genres
      }
    }
    
    // Similar cast/director recommendations
    if (favorites.length > 0) {
      const castRecs = await this.getSimilarCastRecommendations()
      const directorRecs = await this.getSimilarDirectorRecommendations()
      
      recommendations.push(...castRecs, ...directorRecs)
    }
    
    return recommendations
  }

  /**
   * Collaborative filtering: "Users who liked X also liked Y"
   */
  private static async getCollaborativeRecommendations(
    userId: string, 
    userFavorites: UserFavorite[]
  ): Promise<Recommendation[]> {
    if (userFavorites.length === 0) return []
    
    const recommendations: Recommendation[] = []
    
    // Find users with similar favorites
    const { data: similarUsers } = await supabase
      .from('favorites')
      .select('user_id, movie_id')
      .in('movie_id', userFavorites.map(f => f.movie_id))
      .neq('user_id', userId)
    
    if (similarUsers && similarUsers.length > 0) {
      // Count common favorites per user
      const userSimilarity: Record<string, number> = {}
      similarUsers.forEach(fav => {
        userSimilarity[fav.user_id] = (userSimilarity[fav.user_id] || 0) + 1
      })
      
      // Find top similar users
      const topSimilarUsers = Object.entries(userSimilarity)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([uid]) => uid)
      
      // Get their other favorites
      const { data: otherFavorites } = await supabase
        .from('favorites')
        .select('movie_id, movie_title')
        .in('user_id', topSimilarUsers)
        .not('movie_id', 'in', `(${userFavorites.map(f => f.movie_id).join(',')})`)
      
      if (otherFavorites) {
        // Count how often each movie is favorited by similar users
        const movieCounts: Record<number, { count: number, title: string }> = {}
        otherFavorites.forEach(fav => {
          movieCounts[fav.movie_id] = {
            count: (movieCounts[fav.movie_id]?.count || 0) + 1,
            title: fav.movie_title
          }
        })
        
        // Convert to recommendations
        Object.entries(movieCounts).forEach(([movieId, data]) => {
          const score = data.count / topSimilarUsers.length // Popularity among similar users
          recommendations.push({
            movie_id: parseInt(movieId),
            score,
            reason: `Users with similar taste also liked this`,
            type: 'collaborative'
          })
        })
      }
    }
    
    return recommendations
  }

  /**
   * Trending recommendations based on user preferences
   */
  private static async getTrendingRecommendations(preferences: UserPreference[]): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []
    
    try {
      // Get trending movies from TMDB
      const trending = await tmdbClient.getTrendingMovies()
      
      trending.results.forEach((movie: TMDBMovie) => {
        // Score based on how well it matches user's genre preferences
        let genreScore = 0
        if (preferences.length > 0) {
          const userGenres = new Set(preferences.map(p => p.genre_id))
          const movieGenres = movie.genre_ids || []
          const matchingGenres = movieGenres.filter((g: number) => userGenres.has(g))
          genreScore = matchingGenres.length / Math.max(movieGenres.length, 1)
        } else {
          genreScore = 0.5 // Default score for new users
        }
        
        const popularityScore = movie.popularity / 1000 // Normalize
        const ratingScore = movie.vote_average / 10
        
        const finalScore = (genreScore * 0.4) + (popularityScore * 0.3) + (ratingScore * 0.3)
        
        recommendations.push({
          movie_id: movie.id,
          score: finalScore,
          reason: 'Trending now',
          type: 'trending'
        })
      })
    } catch (error) {
      console.error('Error fetching trending movies:', error)
    }
    
    return recommendations
  }

  /**
   * Find movies with similar cast members
   */
  private static async getSimilarCastRecommendations(): Promise<Recommendation[]> {
    return []
  }

  /**
   * Find movies by similar directors
   */
  private static async getSimilarDirectorRecommendations(): Promise<Recommendation[]> {
    return []
  }

  /**
   * Combine and deduplicate recommendations with smart weighting
   */
  private static combineRecommendations(allRecs: Recommendation[]): Recommendation[] {
    const movieScores: Record<number, Recommendation> = {}
    
    allRecs.forEach(rec => {
      if (movieScores[rec.movie_id]) {
        // Combine scores if same movie appears multiple times
        movieScores[rec.movie_id].score += rec.score * 0.5 // Weight additional matches less
      } else {
        // Apply different weights based on recommendation type
        let weightedScore = rec.score
        if (rec.type === 'content') {
          weightedScore *= 3.0 // Heavily favor content-based recommendations
        } else if (rec.type === 'collaborative') {
          weightedScore *= 2.0 // Favor collaborative recommendations
        } else if (rec.type === 'trending') {
          weightedScore *= 0.3 // De-emphasize trending recommendations
        }
        
        movieScores[rec.movie_id] = {
          ...rec,
          score: weightedScore
        }
      }
    })
    
    return Object.values(movieScores).sort((a, b) => b.score - a.score)
  }

  /**
   * Cache recommendations in database
   */
  private static async cacheRecommendations(userId: string, recommendations: Recommendation[]) {
    const cacheData = recommendations.map(rec => ({
      user_id: userId,
      movie_id: rec.movie_id,
      recommendation_score: rec.score,
      recommendation_type: rec.type,
      reason: rec.reason
    }))
    
    // Clear old recommendations
    await supabase
      .from('user_recommendations')
      .delete()
      .eq('user_id', userId)
    
    // Insert new ones
    await supabase
      .from('user_recommendations')
      .insert(cacheData)
  }

  /**
   * Get user preferences from database
   */
  private static async getUserPreferences(userId: string): Promise<UserPreference[]> {
    const { data } = await supabase
      .from('user_preferences')
      .select('genre_id, preference_score')
      .eq('user_id', userId)
    
    return data || []
  }

  /**
   * Get user's favorite movies
   */
  private static async getUserFavorites(userId: string): Promise<UserFavorite[]> {
    const { data } = await supabase
      .from('favorites')
      .select('movie_id, movie_title')
      .eq('user_id', userId)
    
    return data || []
  }

  /**
   * Get user's watchlist
   */
  private static async getUserWatchlist(userId: string): Promise<UserWatchlistItem[]> {
    const { data } = await supabase
      .from('watchlist')
      .select('movie_id, movie_title')
      .eq('user_id', userId)
    
    return data || []
  }

  /**
   * Fetch movie details from TMDB
   */
  private static async fetchMovieDetails(movieIds: number[]): Promise<Movie[]> {
    const movies: Movie[] = []
    
    for (const id of movieIds) {
      try {
        const movie = await tmdbClient.getMovieDetails(id)
        movies.push(movie)
      } catch (error) {
        console.error(`Error fetching movie ${id}:`, error)
      }
    }
    
    return movies
  }

  /**
   * Helper to get genre name by ID
   */
  private static getGenreName(genreId: number): string {
    const genreMap: Record<number, string> = {
      28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
      80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
      14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
      9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
      10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
    }
    return genreMap[genreId] || 'Unknown'
  }

  /**
   * Shuffle array to add variety to recommendations
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  /**
   * Intelligent genre-based fallback using TMDB API with specific exclusions
   */
  private static async getIntelligentGenreFallbackWithExclusions(
    preferences: UserPreference[], 
    excludedMovieIds: Set<number>, 
    limit: number
  ): Promise<Movie[]> {
    try {
      // If user has preferences, search by their favorite genres
      if (preferences.length > 0) {
        console.log('Using genre-based recommendations')
        const movies: Movie[] = []
        
        // Get top 3 preferred genres
        const topGenres = preferences
          .filter(p => p.preference_score > 0.1) // Lower threshold
          .sort((a, b) => b.preference_score - a.preference_score)
          .slice(0, 5) // Include more genres

        for (const genre of topGenres) {
          try {
            console.log(`Searching for ${this.getGenreName(genre.genre_id)} movies`)
            
            // Search for highly-rated movies in this genre
            // Try different sorting methods for variety
            const sortOptions = ['vote_average.desc', 'popularity.desc', 'vote_count.desc']
            const sortBy = sortOptions[Math.floor(Math.random() * sortOptions.length)]
            
            const genreMovies = await tmdbClient.discoverMovies({
              genre: genre.genre_id.toString(),
              rating: '6.0', // Lower threshold for more movies
              sortBy: sortBy,
              page: 1
            })

            if (genreMovies?.results) {
              const filteredMovies = genreMovies.results
                .filter((movie: TMDBMovie) => !excludedMovieIds.has(movie.id))
                .slice(0, Math.ceil(limit / Math.max(topGenres.length, 1)) + 2) // Get more per genre

              for (const movieData of filteredMovies) {
                try {
                  const fullMovie = await tmdbClient.getMovieDetails(movieData.id)
                  movies.push(fullMovie)
                  
                  // Stop if we have enough total movies
                  if (movies.length >= limit) break
                } catch (detailError) {
                  console.warn(`Failed to get details for movie ${movieData.id}:`, detailError)
                }
              }
            }
            
            // Stop searching more genres if we have enough movies
            if (movies.length >= limit) break
          } catch (genreError) {
            console.warn(`Failed to search genre ${genre.genre_id}:`, genreError)
          }
        }

        if (movies.length > 0) {
          // Deduplicate by movie ID to prevent React key conflicts
          const uniqueMovies = movies.filter((movie, index, self) => 
            index === self.findIndex(m => m.id === movie.id)
          )
          return this.shuffleArray(uniqueMovies).slice(0, limit)
        }
      }

      // Fallback to simple trending if genre search fails
      console.log('Falling back to trending movies')
      return await this.getSimpleTrendingFallback([], [], limit)
    } catch (error) {
      console.error('Intelligent fallback failed:', error)
      return await this.getSimpleTrendingFallback([], [], limit)
    }
  }

  /**
   * Intelligent genre-based fallback using TMDB API
   */
  private static async getIntelligentGenreFallback(
    preferences: UserPreference[], 
    userFavorites: UserFavorite[], 
    userWatchlist: UserWatchlistItem[], 
    limit: number
  ): Promise<Movie[]> {
    try {
      const userMovieIds = new Set([
        ...userFavorites.map(f => f.movie_id),
        ...userWatchlist.map(w => w.movie_id)
      ])

      // If user has preferences, search by their favorite genres
      if (preferences.length > 0) {
        console.log('Using genre-based recommendations')
        const movies: Movie[] = []
        
        // Get top 3 preferred genres
        const topGenres = preferences
          .filter(p => p.preference_score > 0)
          .sort((a, b) => b.preference_score - a.preference_score)
          .slice(0, 3)

        for (const genre of topGenres) {
          try {
            console.log(`Searching for ${this.getGenreName(genre.genre_id)} movies`)
            
            // Search for highly-rated movies in this genre
            // Try different sorting methods for variety
            const sortOptions = ['vote_average.desc', 'popularity.desc', 'vote_count.desc']
            const sortBy = sortOptions[Math.floor(Math.random() * sortOptions.length)]
            
            const genreMovies = await tmdbClient.discoverMovies({
              genre: genre.genre_id.toString(),
              rating: '6.0', // Lower threshold for more movies
              sortBy: sortBy,
              page: 1
            })

            if (genreMovies?.results) {
              const filteredMovies = genreMovies.results
                .filter((movie: TMDBMovie) => !userMovieIds.has(movie.id))
                .slice(0, Math.ceil(limit / Math.max(topGenres.length, 1)) + 2) // Get more per genre

              for (const movieData of filteredMovies) {
                try {
                  const fullMovie = await tmdbClient.getMovieDetails(movieData.id)
                  movies.push(fullMovie)
                  
                  // Stop if we have enough total movies
                  if (movies.length >= limit) break
                } catch (detailError) {
                  console.warn(`Failed to get details for movie ${movieData.id}:`, detailError)
                }
              }
            }
            
            // Stop searching more genres if we have enough movies
            if (movies.length >= limit) break
          } catch (genreError) {
            console.warn(`Failed to search genre ${genre.genre_id}:`, genreError)
          }
        }

        if (movies.length > 0) {
          // Deduplicate by movie ID to prevent React key conflicts
          const uniqueMovies = movies.filter((movie, index, self) => 
            index === self.findIndex(m => m.id === movie.id)
          )
          return this.shuffleArray(uniqueMovies).slice(0, limit)
        }
      }

      // Fallback to simple trending if genre search fails
      console.log('Falling back to trending movies')
      return await this.getSimpleTrendingFallback(userFavorites, userWatchlist, limit)
    } catch (error) {
      console.error('Intelligent fallback failed:', error)
      return await this.getSimpleTrendingFallback(userFavorites, userWatchlist, limit)
    }
  }

  /**
   * Simple fallback when complex recommendations fail
   */
  private static async getSimpleTrendingFallback(userFavorites: UserFavorite[], userWatchlist: UserWatchlistItem[], limit: number): Promise<Movie[]> {
    try {
      const trending = await tmdbClient.getTrendingMovies()
      const userMovieIds = new Set([
        ...userFavorites.map(f => f.movie_id),
        ...userWatchlist.map(w => w.movie_id)
      ])
      
      const availableMovies = trending.results
        .filter((movie: TMDBMovie) => !userMovieIds.has(movie.id))
      
      // Shuffle for variety and take requested amount
      return this.shuffleArray(availableMovies).slice(0, limit) as Movie[]
    } catch (error) {
      console.error('Even fallback trending failed:', error)
      return []
    }
  }

  /**
   * Finalize recommendations by filtering, caching, shuffling and fetching details
   */
  private static async finalizeRecommendations(
    allRecommendations: Recommendation[], 
    userFavorites: UserFavorite[], 
    userWatchlist: UserWatchlistItem[], 
    limit: number,
    userId: string
  ): Promise<Movie[]> {
    // 7. Filter out movies user already has
    const userMovieIds = new Set([
      ...userFavorites.map(f => f.movie_id),
      ...userWatchlist.map(w => w.movie_id)
    ])
    
    console.log(`DEBUG - User has ${userMovieIds.size} existing movies (${userFavorites.length} favorites + ${userWatchlist.length} watchlist)`)
    
    const beforeFilter = allRecommendations.length
    const filteredRecs = allRecommendations
      .filter(rec => !userMovieIds.has(rec.movie_id))
      .slice(0, limit)
    
    console.log(`DEBUG - Filtered: ${beforeFilter} → ${filteredRecs.length} (removed ${beforeFilter - filteredRecs.length} duplicates)`)
    
    // 7.5. If we don't have enough recommendations after filtering, top up with more genre-based
    if (filteredRecs.length < limit) {
      const needed = limit - filteredRecs.length
      console.log(`DEBUG - Need ${needed} more movies, topping up with genre-based`)
      
      // Get user preferences for genre search
      const userPreferences = await this.getUserPreferences(userId)
      if (userPreferences.length > 0) {
        // Create exclusion set of all movies we already have (existing + current recommendations)
        const allExistingIds = new Set([
          ...userMovieIds,
          ...filteredRecs.map(rec => rec.movie_id)
        ])
        
        // Get additional genre-based movies
        const additionalMovies = await this.getIntelligentGenreFallbackWithExclusions(
          userPreferences,
          allExistingIds,
          needed
        )
        
        // Convert to Recommendation format and add them
        const additionalRecs: Recommendation[] = additionalMovies.map((movie: Movie) => ({
          movie_id: movie.id,
          score: 0.4, // Lower score so they appear after main recommendations
          reason: 'Additional genre-based recommendation',
          type: 'content' as const
        }))
        
        filteredRecs.push(...additionalRecs)
        console.log(`DEBUG - Added ${additionalRecs.length} additional movies, now have ${filteredRecs.length} total`)
      }
    }
    
    // 8. Cache recommendations in database (skip if caching fails)
    try {
      await this.cacheRecommendations(userId, filteredRecs)
    } catch (cacheError) {
      console.warn('Failed to cache recommendations:', cacheError)
    }
    
    // 9. Add some randomization to show variety
    const shuffledRecs = this.shuffleArray(filteredRecs).slice(0, limit)
    
    // 10. Fetch movie details from TMDB
    const movies = await this.fetchMovieDetails(shuffledRecs.map((r: Recommendation) => r.movie_id))
    
    console.log(`DEBUG - Final movies returned: ${movies.length}`)
    
    return movies
  }

  /**
   * Update user preferences based on their actions
   */
  static async updateUserPreferences(userId: string, movie: Movie, action: 'favorite' | 'unfavorite' | 'watchlist') {
    const weight = action === 'favorite' ? 0.3 : (action === 'watchlist' ? 0.1 : -0.2)
    
    // If no genre_ids, try to get them from TMDB
    let genreIds = movie.genre_ids || []
    let movieDetails: TMDBMovieDetails | undefined = undefined
    
    if (genreIds.length === 0) {
      try {
        movieDetails = await tmdbClient.getMovieDetails(movie.id)
        genreIds = movieDetails?.genres?.map((g: TMDBGenre) => g.id) || []
      } catch (error) {
        console.error(`Failed to fetch genres for ${movie.title}:`, error)
        return
      }
    }
    
    if (genreIds.length === 0) {
      return
    }

    // Populate movie_features table when favoriting
    if (action === 'favorite') {
      await this.populateMovieFeatures(movie, movieDetails)
    }
    
    // Update preferences for each genre in the movie
    for (const genreId of genreIds) {
      try {
        // Try to get existing preference (without .single() to avoid 406 errors)
        const { data: existingData } = await supabase
          .from('user_preferences')
          .select('preference_score')
          .eq('user_id', userId)
          .eq('genre_id', genreId)
          .limit(1)
        
        if (existingData && existingData.length > 0) {
          // Update existing preference
          const existing = existingData[0]
          const newScore = Math.max(-1, Math.min(1, existing.preference_score + weight))
          await supabase
            .from('user_preferences')
            .update({ preference_score: newScore, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('genre_id', genreId)
        } else {
          // Create new preference
          await supabase
            .from('user_preferences')
            .insert({
              user_id: userId,
              genre_id: genreId,
              preference_score: weight
            })
        }
      } catch (error) {
        console.error(`Error updating preference for genre ${genreId}:`, error)
        // Continue with other genres even if one fails
      }
    }
  }

  /**
   * Populate movie_features table on-demand when user favorites a movie
   */
  private static async populateMovieFeatures(movie: Movie, movieDetails?: TMDBMovieDetails) {
    try {
      // Check if movie already exists in features table
      const { data: existing } = await supabase
        .from('movie_features')
        .select('movie_id')
        .eq('movie_id', movie.id)
        .limit(1)

      if (existing && existing.length > 0) {
        return // Already exists
      }

      // Get full movie details if not provided
      let finalMovieDetails = movieDetails
      if (!finalMovieDetails) {
        finalMovieDetails = await tmdbClient.getMovieDetails(movie.id)
      }

      // Extract features with safe access
      const genres = finalMovieDetails?.genres?.map((g: TMDBGenre) => g.id) || movie.genre_ids || []
      const castIds = finalMovieDetails?.credits?.cast?.slice(0, 10).map((c: { id: number; name: string }) => c.id) || []
      const directorId = finalMovieDetails?.credits?.crew?.find((c: { id: number; name: string; job: string }) => c.job === 'Director')?.id || null
      
      // Insert into movie_features table
      const { error } = await supabase
        .from('movie_features')
        .insert({
          movie_id: movie.id,
          genres: genres,
          cast_ids: castIds,
          director_id: directorId,
          popularity_score: movie.popularity || finalMovieDetails?.popularity || 0,
          vote_average: movie.vote_average || finalMovieDetails?.vote_average || 0,
          release_year: new Date(movie.release_date || finalMovieDetails?.release_date || '2000-01-01').getFullYear(),
          runtime: finalMovieDetails?.runtime || 0
        })

      if (error) {
        console.warn(`Failed to populate movie features for ${movie.title}:`, error)
      } else {
        console.log(`Populated movie features for ${movie.title}`)
      }
    } catch (error) {
      console.warn(`Error populating movie features for ${movie.title}:`, error)
    }
  }
} 