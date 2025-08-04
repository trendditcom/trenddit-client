/**
 * Trend Service
 * Centralized service for accessing trends across the application
 * Replaces direct mockTrends imports with dynamic trend fetching
 */

import { Trend, TrendCategory } from '../types/trend';

// Simple in-memory cache for client-side usage
let trendsCache: { [key: string]: { trends: Trend[], timestamp: number } } = {};
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Get trends with caching support
 */
export async function getTrends(category?: TrendCategory, limit: number = 20): Promise<Trend[]> {
  const cacheKey = `${category || 'all'}_${limit}`;
  const cached = trendsCache[cacheKey];
  
  // Check if cache is still valid
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.trends;
  }
  
  try {
    // Dynamic import to avoid client-side import issues
    const { generateDynamicTrends } = await import('../server/trend-generator');
    
    // Generate fresh trends
    const trends = await generateDynamicTrends(category, limit);
    
    // Cache the results
    trendsCache[cacheKey] = {
      trends,
      timestamp: Date.now()
    };
    
    return trends;
  } catch (error) {
    console.error('Error fetching trends:', error);
    
    // Return cached data if available, even if expired
    if (cached) {
      return cached.trends;
    }
    
    // Final fallback - return empty array
    return [];
  }
}

/**
 * Get a single trend by ID
 */
export async function getTrendById(trendId: string): Promise<Trend | null> {
  try {
    // First check cache
    for (const cached of Object.values(trendsCache)) {
      const trend = cached.trends.find(t => t.id === trendId);
      if (trend) {
        return trend;
      }
    }
    
    // If not in cache, generate/fetch it
    const { getDynamicTrendById } = await import('../server/trend-generator');
    const trend = await getDynamicTrendById(trendId);
    return trend;
  } catch (error) {
    console.error('Error fetching trend by ID:', error);
    return null;
  }
}

/**
 * Get trends for display in components (limited set)
 */
export async function getTrendsForDisplay(limit: number = 5): Promise<Trend[]> {
  return await getTrends(undefined, limit);
}

/**
 * Clear trends cache (useful for forced refresh)
 */
export function clearTrendsCache(): void {
  trendsCache = {};
}

/**
 * Get cached trends without API call (for immediate display)
 */
export function getCachedTrends(category?: TrendCategory): Trend[] {
  const cacheKey = `${category || 'all'}_20`;
  const cached = trendsCache[cacheKey];
  
  return cached?.trends || [];
}

/**
 * Preload trends for better performance
 */
export async function preloadTrends(): Promise<void> {
  try {
    // Preload common trend combinations
    await Promise.allSettled([
      getTrends(undefined, 20), // All trends
      getTrends('consumer', 10),
      getTrends('competition', 10),
      getTrends('economy', 10),
      getTrends('regulation', 10),
    ]);
  } catch (error) {
    console.error('Error preloading trends:', error);
  }
}