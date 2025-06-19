export interface Movie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  adult: boolean
  original_language: string
  original_title: string
  popularity: number
  video: boolean
}

export interface MovieDetails extends Movie {
  runtime: number
  budget: number
  revenue: number
  genres: Genre[]
  production_companies: ProductionCompany[]
  production_countries: ProductionCountry[]
  spoken_languages: SpokenLanguage[]
  status: string
  tagline: string | null
  homepage: string | null
  imdb_id: string | null
  credits: {
    cast: CastMember[]
    crew: CrewMember[]
  }
  videos: {
    results: Video[]
  }
  reviews: {
    results: Review[]
    total_pages: number
    total_results: number
  }
  similar: {
    results: Movie[]
    total_pages: number
    total_results: number
  }
}

export interface Genre {
  id: number
  name: string
}

export interface ProductionCompany {
  id: number
  logo_path: string | null
  name: string
  origin_country: string
}

export interface ProductionCountry {
  iso_3166_1: string
  name: string
}

export interface SpokenLanguage {
  english_name: string
  iso_639_1: string
  name: string
}

export interface CastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
  cast_id: number
  credit_id: string
  adult: boolean
  gender: number | null
  known_for_department: string
  original_name: string
  popularity: number
}

export interface CrewMember {
  id: number
  name: string
  job: string
  department: string
  profile_path: string | null
  credit_id: string
  adult: boolean
  gender: number | null
  known_for_department: string
  original_name: string
  popularity: number
}

export interface Video {
  id: string
  iso_639_1: string
  iso_3166_1: string
  key: string
  name: string
  official: boolean
  published_at: string
  site: string
  size: number
  type: string
}

export interface Review {
  id: string
  author: string
  author_details: {
    name: string
    username: string
    avatar_path: string | null
    rating: number | null
  }
  content: string
  created_at: string
  updated_at: string
  url: string
}

export interface TMDBResponse<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

export interface UserMovie {
  id: string
  user_id: string
  movie_id: number
  movie_title: string
  movie_poster: string | null
  rating: number | null
  is_favorite: boolean
  is_watchlisted: boolean
  watched_at: string | null
  created_at: string
  updated_at: string
} 