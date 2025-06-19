'use client'

import { useState, useEffect } from 'react'
import { Movie } from '@/types/movie'
import { RecommendationEngine } from '@/lib/recommendations'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'

export function useRecommendations() {
  const { user } = useAuth()
  const [recommendations, setRecommendations] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null)

  const generateRecommendations = async (forceRefresh: boolean = false) => {
    if (!user) {
      setRecommendations([])
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Clear cached recommendations if force refresh
      if (forceRefresh) {
        await clearCachedRecommendations(user.id)
      }
      
      const recs = await RecommendationEngine.generateRecommendations(user.id, 12)
      setRecommendations(recs)
      setLastGenerated(new Date())
    } catch (err) {
      console.error('Error generating recommendations:', err)
      setError('Failed to generate recommendations')
    } finally {
      setLoading(false)
    }
  }

  // Helper to clear cached recommendations
  const clearCachedRecommendations = async (userId: string) => {
    try {
      await supabase
        .from('user_recommendations')
        .delete()
        .eq('user_id', userId)
    } catch (error) {
      console.warn('Failed to clear cached recommendations:', error)
    }
  }

  // Auto-generate recommendations when user changes
  useEffect(() => {
    if (user) {
      generateRecommendations()
    } else {
      // Clear recommendations when user logs out
      setRecommendations([])
      setError(null)
      setLastGenerated(null)
    }
  }, [user])

  // Check if recommendations need refresh (older than 1 hour)
  const needsRefresh = () => {
    if (!lastGenerated) return true
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    return lastGenerated < oneHourAgo
  }

  const forceRefresh = () => generateRecommendations(true)

  return {
    recommendations,
    loading,
    error,
    generateRecommendations: () => generateRecommendations(false),
    forceRefresh,
    needsRefresh,
    lastGenerated
  }
} 