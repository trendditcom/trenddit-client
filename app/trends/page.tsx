'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/ui/card';
import { Button } from '@/lib/ui/button';
import { Badge } from '@/lib/ui/badge';
import { Input } from '@/lib/ui/input';
import { TrendFilters } from '@/features/trends';
import { TrendCategory } from '@/features/trends';
import { EnhancedTrendGrid } from '@/features/trends/components/EnhancedTrendGrid';
import { TrendRowView } from '@/features/trends/components/TrendRowView';
import { trpc } from '@/lib/trpc/client';
import { useFeatureFlag } from '@/lib/flags';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  AlertCircle, 
  Activity,
  MessageSquare,
  Loader2,
  Zap,
  Download,
  Grid3X3,
  List,
  ChevronDown,
  ChevronUp,
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
  const [dashboardExpanded, setDashboardExpanded] = useState(true);
  const [conversationMode, setConversationMode] = useState(false);
  const [currentTopic, setCurrentTopic] = useState('');
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [analyzingTrendId, setAnalyzingTrendId] = useState<string | null>(null);

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
  const analyzeTrendMutation = trpc.trends.analyze.useMutation();
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

  // Intelligence queries
  const dashboardQuery = trpc.intelligence.getIntelligenceDashboard.useQuery();
  const generateInsights = trpc.intelligence.generateConversationalInsights.useMutation({
    onSuccess: (data) => {
      setConversationHistory(prev => [...prev, data.primaryInsight]);
    },
  });
  const synthesizeIntelligence = trpc.intelligence.synthesizeMarketIntelligence.useMutation();

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

  // Event handlers
  const handleConversationStart = async (trendId: string) => {
    try {
      const trend = await utils.trends.getById.fetch({ trendId });
      
      if (trend) {
        setCurrentTopic(trend.title);
        setConversationMode(true);
        
        generateInsights.mutate({
          conversationContext: {
            previousMessages: [],
            currentTopic: trend.title,
            userQuestions: [`Tell me about ${trend.title} and its relevance to my company`],
          },
          userRole: 'cto',
          companyContext: {
            industry: companyProfile.industry,
            size: companyProfile.size,
            challenges: ['scalability', 'compliance', 'talent'],
          },
        });
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const handleMarketSynthesis = (query: string) => {
    synthesizeIntelligence.mutate({
      query,
      confidenceThreshold: 0.7,
      includeReasoningChain: true,
    });
  };

  const handleExport = () => {
    if (!exportEnabled || !allTrends) return;
    const trendIds = allTrends.map((t) => t.id);
    exportMutation.mutate({ format: 'pdf', trendIds });
  };

  const handleAnalyzeTrend = (trendId: string) => {
    setAnalyzingTrendId(trendId);
    analyzeTrendMutation.mutate(
      { trendId },
      {
        onSettled: () => setAnalyzingTrendId(null),
      }
    );
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    AI-First Trend Intelligence
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Real-time market intelligence with multi-agent reasoning
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block"></span>
                  Live Intelligence Active
                </Badge>
                
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
                
                <Button
                  variant="outline"
                  onClick={() => setConversationMode(!conversationMode)}
                  className="flex items-center gap-2 text-sm"
                >
                  <MessageSquare className="h-4 w-4" />
                  {conversationMode ? 'Exit' : 'Chat'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Intelligence Dashboard - Collapsible */}
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Live Intelligence Dashboard
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDashboardExpanded(!dashboardExpanded)}
                    className="p-1"
                  >
                    {dashboardExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              
              {dashboardExpanded && (
                <CardContent className="space-y-4">
                  {/* Dashboard Metrics */}
                  {dashboardQuery.data ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {dashboardQuery.data.summary.totalInsights}
                        </div>
                        <div className="text-sm text-gray-600">Live Trends</div>
                        <div className="text-xs text-gray-700 font-medium">Actively monitored</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round(dashboardQuery.data.summary.averageConfidence * 100)}%
                        </div>
                        <div className="text-sm text-gray-600">AI Confidence</div>
                        <div className="text-xs text-gray-700 font-medium">Analysis accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round(dashboardQuery.data.summary.cacheHitRate * 100)}%
                        </div>
                        <div className="text-sm text-gray-600">Data Freshness</div>
                        <div className="text-xs text-gray-700 font-medium">Real-time updates</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {dashboardQuery.data.systemHealth.agentsOnline}
                        </div>
                        <div className="text-sm text-gray-600">AI Agents</div>
                        <div className="text-xs text-gray-700 font-medium">Processing trends</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  )}

                  {/* Live Market Synthesis */}
                  <div className="pt-4 border-t border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">Live Market Intelligence Synthesis</span>
                      <Badge variant="outline" className="text-xs">
                        AI-Powered
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id="market-synthesis-input"
                        placeholder="Ask about AI trends, market shifts, competitive analysis..."
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            handleMarketSynthesis(e.currentTarget.value.trim());
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button
                        disabled={synthesizeIntelligence.isPending}
                        onClick={() => {
                          const input = document.getElementById('market-synthesis-input') as HTMLInputElement;
                          if (input?.value.trim()) {
                            handleMarketSynthesis(input.value.trim());
                            input.value = '';
                          }
                        }}
                        className="px-6"
                      >
                        {synthesizeIntelligence.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Analyze
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* Quick action buttons */}
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarketSynthesis("What are the top 3 AI trends affecting enterprise businesses this quarter?")}
                        disabled={synthesizeIntelligence.isPending}
                        className="text-xs"
                      >
                        Trending AI Insights
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarketSynthesis("Analyze current competitive landscape in AI automation tools")}
                        disabled={synthesizeIntelligence.isPending}
                        className="text-xs"
                      >
                        Competitive Analysis
                      </Button>
                    </div>

                    {synthesizeIntelligence.data && (
                      <div className="mt-4 p-4 bg-white rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            {Math.round(synthesizeIntelligence.data.confidence * 100)}% confidence
                          </Badge>
                          <Badge variant="secondary">
                            {synthesizeIntelligence.data.metadata.processingTime}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3">
                          {synthesizeIntelligence.data.synthesis}
                        </p>

                        {synthesizeIntelligence.data.crossAgentInsights.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Cross-Agent Insights:</h4>
                            {synthesizeIntelligence.data.crossAgentInsights.map((insight: string, index: number) => (
                              <div key={index} className="text-xs text-gray-600 pl-4 border-l-2 border-blue-200">
                                {insight}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

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
                  onConversationStart={handleConversationStart}
                  onGenerateNeeds={handleGenerateNeeds}
                  onAnalyzeTrend={handleAnalyzeTrend}
                  analyzingTrendId={analyzingTrendId}
                />
              ) : (
                <TrendRowView
                  trends={filteredTrends}
                  companyProfile={companyProfile}
                  onConversationStart={handleConversationStart}
                  onGenerateNeeds={handleGenerateNeeds}
                  onAnalyzeTrend={handleAnalyzeTrend}
                  analyzingTrendId={analyzingTrendId}
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Live Market Signals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4" />
                  Market Signals
                  <Badge variant="outline" className="text-xs">
                    {companyProfile.industry}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardQuery.data ? (
                  <div className="space-y-3">
                    {dashboardQuery.data.marketSignals.map((signal: { signal: string; strength: string; confidence: number }, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border-l-2 border-l-blue-500">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{signal.signal}</span>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={signal.strength === 'strong' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {signal.strength}
                            </Badge>
                            <span className="text-xs text-gray-700 font-medium">
                              {Math.round(signal.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-800">
                          Relevant for {companyProfile.size} companies in {companyProfile.industry}
                        </div>
                      </div>
                    ))}
                    
                    {/* Action buttons for market signals */}
                    <div className="pt-2 border-t border-gray-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarketSynthesis(`What market signals should ${companyProfile.industry} companies watch for?`)}
                        className="w-full text-xs"
                      >
                        Get Industry-Specific Signals
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Conversational Interface */}
            {conversationMode && (
              <Card className="border-2 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageSquare className="h-4 w-4" />
                    AI Conversation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700">
                      Topic: {currentTopic}
                    </div>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {conversationHistory.map((message, index) => (
                        <div key={index} className="p-2 bg-blue-50 rounded text-xs">
                          {message}
                        </div>
                      ))}
                      
                      {generateInsights.isPending && (
                        <div className="p-2 bg-gray-50 rounded text-xs flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          AI is thinking...
                        </div>
                      )}
                    </div>

                    {generateInsights.data && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium">Follow-up questions:</div>
                        {generateInsights.data.followUpQuestions.slice(0, 2).map((question: string, index: number) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="w-full text-xs h-auto py-2 px-3 text-left"
                            onClick={() => {
                              setConversationHistory(prev => [...prev, `You: ${question}`]);
                              // In real implementation, this would trigger another AI response
                            }}
                          >
                            {question}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-sm"
                  onClick={() => router.push('/needs')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Find Needs
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-sm"
                  onClick={() => router.push('/solutions')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Solutions
                </Button>
                {exportEnabled && allTrends && allTrends.length > 0 && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-sm"
                    onClick={handleExport}
                    disabled={exportMutation.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {exportMutation.isPending ? 'Exporting...' : 'Export All'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}