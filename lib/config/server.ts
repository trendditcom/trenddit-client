// Server-side configuration with Node.js dependencies
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Full server configuration interface
export interface ServerConfig {
  app: {
    name: string;
    version: string;
    environment: string;
  };
  ai: {
    provider: string;
    model: string;
    temperature: number;
    max_tokens: number;
    retry: {
      max_attempts: number;
      initial_delay: number;
      max_delay: number;
      backoff_factor: number;
    };
    streaming: {
      enabled: boolean;
      chunk_size: number;
      flush_interval: number;
    };
  };
  cache: {
    redis: {
      enabled: boolean;
      ttl: {
        trends: number;
        needs: number;
        solutions: number;
        analysis: number;
      };
    };
    memory: {
      enabled: boolean;
      max_size: number;
      ttl: {
        trends: number;
        needs: number;
        solutions: number;
      };
    };
  };
  errors: {
    show_details: boolean;
    logging: {
      enabled: boolean;
      service: string;
    };
    messages: {
      api_key_missing: string;
      rate_limit: string;
      network_error: string;
      generation_failed: string;
    };
  };
  ui: {
    loading: {
      skeleton: {
        enabled: boolean;
        animation: string;
        duration: number;
      };
      progress: {
        enabled: boolean;
        show_after: number;
        messages: string[];
      };
    };
  };
  features: {
    use_mock_data: boolean;
    streaming_responses: boolean;
    detailed_errors: boolean;
    aggressive_caching: boolean;
  };
  rate_limiting: {
    user: {
      trends: {
        requests_per_minute: number;
        requests_per_hour: number;
      };
      needs: {
        requests_per_minute: number;
        requests_per_hour: number;
      };
      solutions: {
        requests_per_minute: number;
        requests_per_hour: number;
      };
    };
  };
  performance: {
    prefetch: {
      enabled: boolean;
      strategies: string[];
    };
    lazy_loading: {
      enabled: boolean;
      threshold: number;
    };
  };
  development: {
    mock_enabled: boolean;
    verbose_logging: boolean;
    api_endpoints: {
      openai: string;
    };
  };
}

// Replace environment variables in config values
function replaceEnvVars(value: unknown): unknown {
  if (typeof value === 'string') {
    // Check if the string contains ${...} pattern
    const envVarPattern = /\$\{([^}]+)\}/g;
    return value.replace(envVarPattern, (match, expression) => {
      // Evaluate the expression safely
      try {
        // Only allow specific environment variables and operations
        const allowedVars = {
          NODE_ENV: process.env.NODE_ENV || 'development',
          OPENAI_API_ENDPOINT: process.env.OPENAI_API_ENDPOINT,
        };
        
        // Simple evaluation for environment checks
        if (expression.includes('===')) {
          const [left, right] = expression.split('===').map((s: string) => s.trim());
          const leftValue = allowedVars[left as keyof typeof allowedVars];
          const rightValue = right.replace(/['"]/g, '');
          return String(leftValue === rightValue);
        }
        
        // OR operation
        if (expression.includes('||')) {
          const [primary, fallback] = expression.split('||').map((s: string) => s.trim());
          return allowedVars[primary as keyof typeof allowedVars] || fallback.replace(/['"]/g, '');
        }
        
        // Direct variable replacement
        return allowedVars[expression as keyof typeof allowedVars] || match;
      } catch (error) {
        console.error(`Error evaluating expression: ${expression}`, error);
        return match;
      }
    });
  }
  
  if (Array.isArray(value)) {
    return value.map(replaceEnvVars);
  }
  
  if (value && typeof value === 'object') {
    const replaced: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      replaced[key] = replaceEnvVars(val);
    }
    return replaced;
  }
  
  return value;
}

// Load configuration from config.yml (server-side only)
let configCache: ServerConfig | null = null;

export function loadServerConfig(): ServerConfig {
  if (configCache) {
    return configCache;
  }

  try {
    const configPath = path.join(process.cwd(), 'config.yml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const rawConfig = yaml.load(fileContents) as Record<string, unknown>;
    
    // Replace environment variables in the config
    const config = replaceEnvVars(rawConfig) as ServerConfig;
    
    // Convert string booleans to actual booleans
    const convertBooleans = (obj: unknown): unknown => {
      if (typeof obj === 'string' && (obj === 'true' || obj === 'false')) {
        return obj === 'true';
      }
      if (Array.isArray(obj)) {
        return obj.map(convertBooleans);
      }
      if (obj && typeof obj === 'object') {
        const converted: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
          converted[key] = convertBooleans(val);
        }
        return converted;
      }
      return obj;
    };
    
    configCache = convertBooleans(config) as ServerConfig;
    return configCache;
  } catch (error) {
    console.error('Failed to load config.yml:', error);
    
    // Return default configuration if file loading fails
    return getDefaultServerConfig();
  }
}

// Get default server configuration
function getDefaultServerConfig(): ServerConfig {
  return {
    app: {
      name: 'Trenddit',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
    ai: {
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 3000,
      retry: {
        max_attempts: 3,
        initial_delay: 1000,
        max_delay: 10000,
        backoff_factor: 2,
      },
      streaming: {
        enabled: true,
        chunk_size: 50,
        flush_interval: 100,
      },
    },
    cache: {
      redis: {
        enabled: true,
        ttl: {
          trends: 1800,
          needs: 3600,
          solutions: 3600,
          analysis: 7200,
        },
      },
      memory: {
        enabled: true,
        max_size: 100,
        ttl: {
          trends: 900,
          needs: 1800,
          solutions: 1800,
        },
      },
    },
    errors: {
      show_details: true,
      logging: {
        enabled: true,
        service: 'sentry',
      },
      messages: {
        api_key_missing: 'OpenAI API key is not configured. Please contact support.',
        rate_limit: 'You\'ve reached the rate limit. Please try again in a few minutes.',
        network_error: 'Unable to connect to the AI service. Please check your internet connection.',
        generation_failed: 'Failed to generate content. Please try again or contact support if the issue persists.',
      },
    },
    ui: {
      loading: {
        skeleton: {
          enabled: true,
          animation: 'pulse',
          duration: 1000,
        },
        progress: {
          enabled: true,
          show_after: 2000,
          messages: [
            'Analyzing market trends...',
            'Generating insights...',
            'Preparing recommendations...',
            'Almost there...',
          ],
        },
      },
    },
    features: {
      use_mock_data: false,
      streaming_responses: true,
      detailed_errors: true,
      aggressive_caching: true,
    },
    rate_limiting: {
      user: {
        trends: {
          requests_per_minute: 10,
          requests_per_hour: 100,
        },
        needs: {
          requests_per_minute: 5,
          requests_per_hour: 50,
        },
        solutions: {
          requests_per_minute: 5,
          requests_per_hour: 50,
        },
      },
    },
    performance: {
      prefetch: {
        enabled: true,
        strategies: ['viewport', 'hover', 'priority'],
      },
      lazy_loading: {
        enabled: true,
        threshold: 0.1,
      },
    },
    development: {
      mock_enabled: process.env.NODE_ENV === 'development',
      verbose_logging: process.env.NODE_ENV === 'development',
      api_endpoints: {
        openai: process.env.OPENAI_API_ENDPOINT || 'https://api.openai.com/v1',
      },
    },
  };
}

// Export a singleton instance for server-side use
export const serverConfig = loadServerConfig();