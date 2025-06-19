'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { Movie } from '@/types/movie'
import { RecommendationEngine } from '@/lib/recommendations'

interface FavoriteItem {
  id: number
  user_id: string
  movie_id: number
  movie_title: string
  movie_poster_path: string | null
  movie_release_date: string | null
  movie_vote_average: number
  added_at: string
}

export function useFavorites() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [itemsLoading, setItemsLoading] = useState<Set<number>>(new Set())

  // Fetch user's favorites
  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([])
      setInitialized(true)
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false })

      if (error) throw error
      setFavorites(data || [])
      setInitialized(true)
    } catch (error) {
      console.error('Error fetching favorites:', error)
      setFavorites([]) // Clear favorites on error
      setInitialized(true)
    } finally {
      setLoading(false)
    }
  }

  // Check if a movie is in the favorites
  const isInFavorites = (movieId: number) => {
    return favorites.some(item => item.movie_id === movieId)
  }

  // Add movie to favorites
  const addToFavorites = async (movie: Movie) => {
    if (!user) return { error: 'User not authenticated' }

    setItemsLoading(prev => new Set(prev).add(movie.id))
    
    try {
      const favoriteItem = {
        user_id: user.id,
        movie_id: movie.id,
        movie_title: movie.title,
        movie_poster_path: movie.poster_path,
        movie_release_date: movie.release_date,
        movie_vote_average: movie.vote_average,
      }

      const { data, error } = await supabase
        .from('favorites')
        .insert([favoriteItem])
        .select()

      if (error) throw error

      // Update local state
      setFavorites(prev => [data[0], ...prev])
      
      // Update user preferences for recommendations (but don't trigger immediate refresh)
      await RecommendationEngine.updateUserPreferences(user.id, movie, 'favorite')
      
      return { error: null }
    } catch (error) {
      console.error('Error adding to favorites:', error)
      return { error: error instanceof Error ? error.message : 'Failed to add to favorites' }
    } finally {
      setItemsLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(movie.id)
        return newSet
      })
    }
  }

  // Remove movie from favorites
  const removeFromFavorites = async (movieId: number) => {
    if (!user) return { error: 'User not authenticated' }

    setItemsLoading(prev => new Set(prev).add(movieId))

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId)

      if (error) throw error

      // Update local state
      setFavorites(prev => prev.filter(item => item.movie_id !== movieId))
      
      // TODO: Update user preferences for recommendations (would need full movie data)
      
      return { error: null }
    } catch (error) {
      console.error('Error removing from favorites:', error)
      return { error: error instanceof Error ? error.message : 'Failed to remove from favorites' }
    } finally {
      setItemsLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(movieId)
        return newSet
      })
    }
  }

  // Toggle movie in favorites
  const toggleFavorites = async (movie: Movie) => {
    if (isInFavorites(movie.id)) {
      return await removeFromFavorites(movie.id)
    } else {
      return await addToFavorites(movie)
    }
  }

  // Check if an item is currently loading
  const isItemLoading = (movieId: number) => {
    return itemsLoading.has(movieId)
  }

  // Initialize favorites when user changes
  useEffect(() => {
    // Reset state when user changes
    setInitialized(false)
    setFavorites([])
    
    // Fetch favorites for the new user
    fetchFavorites()
  }, [user])

  return {
    favorites,
    loading,
    initialized,
    isInFavorites,
    addToFavorites,
    removeFromFavorites,
    toggleFavorites,
    isItemLoading,
    refetch: fetchFavorites,
  }
} 