import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  if (!date) return 'Unknown Date'
  const parsedDate = new Date(date)
  if (isNaN(parsedDate.getTime())) return 'Unknown Date'
  
  return parsedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatRuntime(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

export function formatRating(rating: number) {
  if (!rating || isNaN(rating)) return '0'
  return (rating * 10).toFixed(0)
} 