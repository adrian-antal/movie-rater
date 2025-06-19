'use client'

import { useRecommendations } from '@/hooks/use-recommendations'
import { MovieCard } from '@/components/movie-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, RefreshCw, TrendingUp, Heart, Users } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export function RecommendationsSection() {
  const { user } = useAuth()
  const { recommendations, loading, error, forceRefresh, needsRefresh } = useRecommendations()

  if (!user) {
    return null
  }

  if (error) {
    return (
      <section className="py-12 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2 text-white">
              <Sparkles className="w-8 h-8 text-purple-400" />
              Recommendations
            </h2>
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={forceRefresh} className="bg-purple-600 hover:bg-purple-700 text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-8 flex items-center justify-center gap-2 text-white">
              <Sparkles className="w-8 h-8 text-purple-400" />
              Generating Your Recommendations
            </h2>
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
              <p className="text-gray-300">Analyzing your taste...</p>
            </div>
            
            {/* Show algorithm explanation while loading */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-white">
                    <Heart className="w-5 h-5 text-red-400" />
                    Content Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-300">
                    Analyzing genres, cast, and directors from your favorites
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-white">
                    <Users className="w-5 h-5 text-blue-400" />
                    Similar Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-300">
                    Finding users with similar taste and their favorites
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-white">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Trending Now
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-300">
                    Popular movies matching your preferences
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (recommendations.length === 0) {
    return (
      <section className="py-12 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2 text-white">
              <Sparkles className="w-8 h-8 text-purple-400" />
              Recommendations
            </h2>
            <p className="text-gray-300 mb-4">
              We need more data to generate personalized recommendations.
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Try adding some movies to your favorites or watchlist first!
            </p>
            <Button onClick={forceRefresh} className="bg-purple-600 hover:bg-purple-700 text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate Recommendations
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold flex items-center gap-2 text-white">
            <Sparkles className="w-8 h-8 text-purple-400" />
            Recommended for You
          </h2>
          <div className="flex items-center gap-2">
            {needsRefresh() && (
              <span className="text-sm text-gray-400">Recommendations may be outdated</span>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={forceRefresh}
              disabled={loading}
              className="border-white/20 bg-white/10 backdrop-blur-xl text-white hover:bg-white/20"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Algorithm explanation */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 mb-8">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-purple-400" />
            How We Generate Your Recommendations
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Heart className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-white">Content-Based</p>
                <p className="text-gray-300">Movies similar to your favorites by genre, cast, and director</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-white">Collaborative Filtering</p>
                <p className="text-gray-300">Movies loved by users with similar taste</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-white">Trending & Popular</p>
                <p className="text-gray-300">Popular movies matching your genre preferences</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {recommendations.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
        
      </div>
    </section>
  )
} 