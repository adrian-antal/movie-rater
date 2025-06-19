'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { Movie } from '@/types/movie'

interface WatchlistItem {
  id: number
  user_id: string
  movie_id: number
  movie_title: string
  movie_poster_path: string | null
  movie_release_date: string | null
  movie_vote_average: number
  added_at: string
}

export function useWatchlist() {
  const { user } = useAuth()
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(false)
  const [itemsLoading, setItemsLoading] = useState<Set<number>>(new Set())

  // Fetch user's watchlist
  const fetchWatchlist = async () => {
    if (!user) {
      setWatchlist([])
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false })

      if (error) throw error
      setWatchlist(data || [])
    } catch (error) {
      console.error('Error fetching watchlist:', error)
      setWatchlist([]) // Clear watchlist on error
    } finally {
      setLoading(false)
    }
  }

  // Check if a movie is in the watchlist
  const isInWatchlist = (movieId: number) => {
    return watchlist.some(item => item.movie_id === movieId)
  }

  // Add movie to watchlist
  const addToWatchlist = async (movie: Movie) => {
    if (!user) return { error: 'User not authenticated' }

    setItemsLoading(prev => new Set(prev).add(movie.id))
    
    try {
      const watchlistItem = {
        user_id: user.id,
        movie_id: movie.id,
        movie_title: movie.title,
        movie_poster_path: movie.poster_path,
        movie_release_date: movie.release_date,
        movie_vote_average: movie.vote_average,
      }

      const { data, error } = await supabase
        .from('watchlist')
        .insert([watchlistItem])
        .select()

      if (error) throw error

      // Update local state
      setWatchlist(prev => [data[0], ...prev])
      return { error: null }
    } catch (error) {
      console.error('Error adding to watchlist:', error)
      return { error: error instanceof Error ? error.message : 'Failed to add to watchlist' }
    } finally {
      setItemsLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(movie.id)
        return newSet
      })
    }
  }

  // Remove movie from watchlist
  const removeFromWatchlist = async (movieId: number) => {
    if (!user) return { error: 'User not authenticated' }

    setItemsLoading(prev => new Set(prev).add(movieId))

    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId)

      if (error) throw error

      // Update local state
      setWatchlist(prev => prev.filter(item => item.movie_id !== movieId))
      return { error: null }
    } catch (error) {
      console.error('Error removing from watchlist:', error)
      return { error: error instanceof Error ? error.message : 'Failed to remove from watchlist' }
    } finally {
      setItemsLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(movieId)
        return newSet
      })
    }
  }

  // Toggle movie in watchlist
  const toggleWatchlist = async (movie: Movie) => {
    if (isInWatchlist(movie.id)) {
      return await removeFromWatchlist(movie.id)
    } else {
      return await addToWatchlist(movie)
    }
  }

  // Check if an item is currently loading
  const isItemLoading = (movieId: number) => {
    return itemsLoading.has(movieId)
  }

  // Initialize watchlist when user changes
  useEffect(() => {
    if (user) {
      fetchWatchlist()
    } else {
      setWatchlist([])
    }
  }, [user])

  return {
    watchlist,
    loading,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isItemLoading,
    refetch: () => user ? fetchWatchlist() : Promise.resolve(),
  }
} 