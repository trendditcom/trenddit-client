/**
 * Shared configuration constants
 * These values should match what's in config.yml
 * Used for client-side access where serverConfig is not available
 */

export const CONFIG_CONSTANTS = {
  ai: {
    // Default system prompt for trend generation
    // This should be kept in sync with config.yml
    systemPrompt: 'You are a market intelligence analyst with deep knowledge of current AI and technology trends. Curate current trends from authoritative sources. Always return valid JSON.',
    
    // Default model settings
    defaultModel: 'gpt-4o-mini',
    defaultTemperature: 0.7,
    defaultMaxTokens: 3000,
  },
  
  trends: {
    // Trend count settings
    minCount: 5,
    maxCount: 20,
    defaultCount: 20,
    
    // Categories
    categories: ['consumer', 'competition', 'economy', 'regulation'] as const,
  },
} as const;

// Type exports for TypeScript
export type TrendCategory = typeof CONFIG_CONSTANTS.trends.categories[number];