'use client'

import { getImageUrl } from '@/lib/tmdb'

export function ImageTest() {
  // Test with a known working poster path
  const testPath = '/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg'
  const imageUrl = getImageUrl(testPath, 'w500')
  
  console.log('Test image URL:', imageUrl)
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-bold mb-2">Image URL Test</h3>
      <p className="text-sm text-gray-600 mb-2">Generated URL:</p>
      <code className="text-xs bg-gray-100 p-2 rounded block mb-4">{imageUrl}</code>
      
      {imageUrl && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Regular img tag:</p>
            <img 
              src={imageUrl} 
              alt="Test" 
              className="w-32 h-48 object-cover rounded"
              onLoad={() => console.log('Regular img loaded successfully')}
              onError={() => console.log('Regular img failed to load')}
            />
          </div>
          
          <div>
            <p className="text-sm font-medium mb-2">Direct link test:</p>
            <a 
              href={imageUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 underline text-sm"
            >
              Open image in new tab
            </a>
          </div>
        </div>
      )}
    </div>
  )
} 