# Deploying Movie Rater to Netlify with SSR

This guide will help you deploy your Next.js Movie Rater app to Netlify with Server-Side Rendering (SSR) enabled.

## Prerequisites

1. GitHub repository with your code
2. Netlify account
3. Environment variables ready

## Step 1: Install Netlify Dependencies

Run this command to install the Netlify Next.js plugin:

```bash
npm install --save-dev @netlify/plugin-nextjs
```

## Step 2: Environment Variables in Netlify

In your Netlify dashboard, go to Site Settings > Environment Variables and add:

```
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here
NEXT_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=https://your-app-name.netlify.app
```

## Step 3: Deploy to Netlify

### Option A: Connect GitHub Repository

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click "New site from Git"
3. Choose GitHub and select your repository
4. Set build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Node version**: `18.x`

### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy (from your project root)
netlify deploy --build

# Deploy to production
netlify deploy --prod --build
```

## Step 4: Configure Supabase for Production

Update your Supabase project settings:

1. **Authentication settings**:
   - Add your Netlify domain to "Site URL"
   - Add your Netlify domain to "Redirect URLs"

2. **Database settings**:
   - Ensure RLS policies are properly configured
   - Test database connections

## Step 5: Verify SSR is Working

After deployment, verify SSR is working:

1. **View page source**: Right-click → "View Page Source"
   - You should see rendered HTML content, not just JavaScript
   - Movie data should be visible in the HTML

2. **Check Network tab**: 
   - Initial page loads should show server-rendered content
   - Subsequent navigation should use client-side routing

3. **Test dynamic routes**:
   - Visit `/movie/[id]` URLs directly
   - Should load without JavaScript enabled

## Features Enabled with SSR

✅ **Server-Side Rendering**: Pages render on the server
✅ **SEO Optimization**: Search engines can crawl content
✅ **Fast Initial Load**: Content visible immediately
✅ **Dynamic API Routes**: Server functions for API calls
✅ **Image Optimization**: Netlify handles image optimization
✅ **Edge Functions**: Fast global performance

## Performance Optimizations

The configuration includes:

- **Caching**: Static assets cached for 1 year
- **Security headers**: XSS protection, frame options
- **Image optimization**: Automatic WebP conversion
- **Edge routing**: Global CDN distribution

## Troubleshooting

### Build Errors
- Check environment variables are set correctly
- Ensure all dependencies are installed
- Review build logs in Netlify dashboard

### SSR Not Working
- Verify `output: undefined` in `next.config.ts`
- Check `netlify.toml` configuration
- Ensure `@netlify/plugin-nextjs` is installed

### Database Connection Issues
- Verify Supabase environment variables
- Check RLS policies for your tables
- Test database connection in local development

## Monitoring and Analytics

Consider adding:
- **Error tracking**: Sentry integration
- **Analytics**: Google Analytics or Netlify Analytics
- **Performance monitoring**: Web Vitals tracking

Your app will be available at: `https://your-app-name.netlify.app`

## Additional Resources

- [Netlify Next.js Documentation](https://docs.netlify.com/integrations/frameworks/next-js/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/environment-variables) 