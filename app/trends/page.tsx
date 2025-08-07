'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { TrendFilters } from '@/features/trends';
import { TrendCategory } from '@/features/trends';
import { EnhancedTrendGrid } from '@/features/trends/components/EnhancedTrendGrid';
import { TrendRowView } from '@/features/trends/components/TrendRowView';
import { trpc } from '@/lib/trpc/client';
import { useFeatureFlag } from '@/lib/flags';
import { 
  TrendingUp, 
  AlertCircle, 
  Loader2,
  Download,
  Grid3X3,
  List,
  Search,
  RefreshCw
} from 'lucide-react';
import { ErrorDisplay } from '@/lib/ui/error-display';
import { TrendCardSkeleton, ProgressLoader } from '@/lib/ui/skeleton';

interface CompanyProfile {
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'enterprise';
  techMaturity: 'low' | 'medium' | 'high';
  domain?: string;
  priorities?: string[];
}

type ViewMode = 'cards' | 'rows';

export default function TrendsPage() {
  const router = useRouter();
  
  // View and UI state
  const [selectedCategory, setSelectedCategory] = useState<TrendCategory | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [searchQuery, setSearchQuery] = useState('');

  // Company profile state
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    industry: 'technology',
    size: 'medium', 
    techMaturity: 'high',
    domain: '',
    priorities: ['scalability', 'innovation'],
  });

  // Feature flags
  const exportEnabled = useFeatureFlag('trends.export');

  // State for refresh control
  const [forceRefresh, setForceRefresh] = useState(false);

  // Try to get initial data from localStorage
  const getInitialTrends = () => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('trenddit_master_trends_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          const isValid = parsed.timestamp && (Date.now() - parsed.timestamp) < (60 * 60 * 1000); // 1 hour
          if (isValid && parsed.trends && parsed.trends.length > 0) {
            return parsed.trends;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load cached trends:', error);
    }
    return undefined;
  };

  // API queries and mutations - always fetch mixed dataset for client-side filtering
  const { data: allTrends, isLoading, error } = trpc.trends.list.useQuery({
    limit: 20, // Always get mixed dataset of 20 trends
    refresh: forceRefresh, // Force refresh when needed
  }, {
    staleTime: 60 * 60 * 1000, // 1 hour - trends stay fresh for longer
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in cache much longer
    enabled: true, // Always enabled
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    initialData: getInitialTrends(), // Use cached data as initial data
  });

  // Cache trends in localStorage when they're fetched
  React.useEffect(() => {
    if (allTrends && allTrends.length > 0) {
      try {
        const cacheData = {
          trends: allTrends,
          timestamp: Date.now(),
        };
        localStorage.setItem('trenddit_master_trends_cache', JSON.stringify(cacheData));
      } catch (error) {
        console.warn('Failed to cache trends in localStorage:', error);
      }
    }
  }, [allTrends]);

  const exportMutation = trpc.trends.export.useMutation();
  const regenerateTrendsMutation = trpc.trends.regenerateForProfile.useMutation({
    onSuccess: () => {
      utils.trends.list.invalidate();
    },
    onError: (error) => {
      console.error('Regenerate trends failed:', error);
      // Fallback to regular refresh
      handleRefreshTrends();
    },
  });


  const utils = trpc.useUtils();

  // Client-side filtering - apply category and search filters to master dataset
  const filteredTrends = React.useMemo(() => {
    if (!allTrends) return [];
    
    let filtered = allTrends;
    
    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(trend => trend.category === selectedCategory);
    }
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(trend => 
        trend.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trend.summary.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [allTrends, selectedCategory, searchQuery]);



  const handleExport = () => {
    if (!exportEnabled || !allTrends) return;
    const trendIds = allTrends.map((t) => t.id);
    exportMutation.mutate({ format: 'pdf', trendIds });
  };


  const handleGenerateNeeds = (trendId: string) => {
    router.push(`/needs?trendId=${trendId}`);
  };

  const handleRefreshTrends = () => {
    // Set refresh flag to true and invalidate cache
    setForceRefresh(true);
    
    // Clear tRPC cache
    utils.trends.list.invalidate();
    
    // Also clear the service layer cache
    import('@/features/trends/services/trend-service').then(({ clearTrendsCache }) => {
      clearTrendsCache();
    });
    
    // Reset refresh flag after a short delay
    setTimeout(() => setForceRefresh(false), 1000);
  };

  const handleRegenerateTrends = () => {
    regenerateTrendsMutation.mutate({
      companyProfile,
      filters: {
        category: selectedCategory || undefined,
        industry: companyProfile.industry,
        priorities: companyProfile.priorities || [],
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-indigo-600">Trenddit</h1>
                <div className="h-8 w-px bg-gray-300"></div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    AI Trend Intelligence
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Track and analyze AI trends for your enterprise
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className="flex items-center gap-2 h-8"
                  >
                    <Grid3X3 className="h-4 w-4" />
                    Cards
                  </Button>
                  <Button
                    variant={viewMode === 'rows' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('rows')}
                    className="flex items-center gap-2 h-8"
                  >
                    <List className="h-4 w-4" />
                    Rows
                  </Button>
                </div>

                <Button
                  variant="outline"
                  onClick={handleRefreshTrends}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                  title="Refresh trends - get latest market intelligence"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>

                {exportEnabled && allTrends && allTrends.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleExport}
                    disabled={exportMutation.isPending}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Download className="h-4 w-4" />
                    {exportMutation.isPending ? 'Exporting...' : 'Export'}
                  </Button>
                )}
                
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
            
            {/* Company Profile & Filters */}
            <div className="space-y-4">
              {/* Company Profile Setup */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      AI Analysis Setup - Configure your company profile for personalized intelligence
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateTrends}
                    disabled={regenerateTrendsMutation.isPending}
                    className="flex items-center gap-2 text-xs"
                  >
                    {regenerateTrendsMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    Regenerate Trends
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Industry</label>
                    <select
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm"
                      value={companyProfile.industry}
                      onChange={(e) => setCompanyProfile(prev => ({ ...prev, industry: e.target.value }))}
                    >
                      <option value="technology">Technology</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="finance">Finance</option>
                      <option value="retail">Retail</option>
                      <option value="manufacturing">Manufacturing</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Company Size</label>
                    <select
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm"
                      value={companyProfile.size}
                      onChange={(e) => setCompanyProfile(prev => ({ 
                        ...prev, 
                        size: e.target.value as CompanyProfile['size']
                      }))}
                    >
                      <option value="startup">Startup (1-50)</option>
                      <option value="small">Small (51-200)</option>
                      <option value="medium">Medium (201-1000)</option>
                      <option value="enterprise">Enterprise (1000+)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Tech Focus</label>
                    <select
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm"
                      value={companyProfile.techMaturity}
                      onChange={(e) => setCompanyProfile(prev => ({ 
                        ...prev, 
                        techMaturity: e.target.value as CompanyProfile['techMaturity']
                      }))}
                    >
                      <option value="low">Foundational</option>
                      <option value="medium">Advanced</option>
                      <option value="high">Innovation Leader</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Company Domain (Optional)</label>
                    <Input
                      placeholder="e.g., company.com, startup.io"
                      value={companyProfile.domain || ''}
                      onChange={(e) => setCompanyProfile(prev => ({ ...prev, domain: e.target.value }))}
                      className="mt-1 text-sm h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Filters and Search */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-shrink-0">
                  <TrendFilters
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                  />
                </div>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <Input
                    placeholder="Search trends..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 min-w-0"
                  />
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <ErrorDisplay 
                error={error} 
                onRetry={() => utils.trends.list.invalidate()}
              />
            )}

            {/* Export Success */}
            {exportMutation.isSuccess && (
              <div className="rounded-md bg-green-50 p-4">
                <p className="text-sm text-green-800">
                  {exportMutation.data.message}
                </p>
              </div>
            )}

            {/* Trends Content */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  AI-Enhanced Trend Intelligence ({filteredTrends.length})
                </h2>
                <div className="text-sm text-gray-700 font-medium">
                  View: {viewMode === 'cards' ? 'Card Grid' : 'Detailed Rows'}
                </div>
              </div>

              {isLoading ? (
                <>
                  <ProgressLoader message="Loading market trends..." />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <TrendCardSkeleton key={i} />
                    ))}
                  </div>
                </>
              ) : viewMode === 'cards' ? (
                <EnhancedTrendGrid
                  trends={filteredTrends}
                  companyProfile={companyProfile}
                  onGenerateNeeds={handleGenerateNeeds}
                />
              ) : (
                <TrendRowView
                  trends={filteredTrends}
                  companyProfile={companyProfile}
                  onGenerateNeeds={handleGenerateNeeds}
                />
              )}
            </div>
        </div>
      </div>
    </div>
  );
}