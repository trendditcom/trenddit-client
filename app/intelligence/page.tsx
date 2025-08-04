/**
 * AI-First Market Intelligence Dashboard
 * Showcases the transformed intelligence capabilities
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/ui/card';
import { Button } from '@/lib/ui/button';
import { Badge } from '@/lib/ui/badge';
import { Input } from '@/lib/ui/input';
import { trpc } from '@/lib/trpc/client';
import { IntelligentTrendCard } from '@/features/market-intelligence/components/IntelligentTrendCard';
// Dynamic trend imports happen at runtime
import { 
  Brain, 
  TrendingUp, 
  Users, 
  AlertCircle, 
  Activity,
  MessageSquare,
  Loader2,
  Zap
} from 'lucide-react';

interface CompanyProfile {
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'enterprise';
  techMaturity: 'low' | 'medium' | 'high';
}

// Dynamic Trends Section Component
function DynamicTrendsSection({ 
  companyProfile, 
  onConversationStart 
}: { 
  companyProfile: CompanyProfile;
  onConversationStart: (trendId: string) => void;
}) {
  const [trends, setTrends] = useState<Array<{
    id: string;
    title: string;
    summary: string;
    category: "consumer" | "competition" | "economy" | "regulation";
    impact_score: number;
    source: string;
    source_url?: string;
    created_at: string | Date;
    updated_at: string | Date;
  }>>([]);
  const [loading, setLoading] = useState(true);

  // Use tRPC to fetch trends
  const trendsQuery = trpc.trends.list.useQuery({ limit: 5 });

  useEffect(() => {
    if (trendsQuery.data) {
      setTrends(trendsQuery.data);
      setLoading(false);
    } else if (trendsQuery.error) {
      console.error('Error loading dynamic trends:', trendsQuery.error);
      setLoading(false);
    } else if (trendsQuery.isLoading) {
      setLoading(true);
    }
  }, [trendsQuery.data, trendsQuery.error, trendsQuery.isLoading]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trends.map((trend) => (
        <IntelligentTrendCard
          key={trend.id}
          trend={trend}
          companyProfile={companyProfile}
          onConversationStart={onConversationStart}
        />
      ))}
    </div>
  );
}

export default function IntelligencePage() {
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    industry: 'technology',
    size: 'medium',
    techMaturity: 'high',
  });
  const [conversationMode, setConversationMode] = useState(false);
  const [currentTopic, setCurrentTopic] = useState('');
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);

  // Get intelligence dashboard data
  const dashboardQuery = trpc.intelligence.getIntelligenceDashboard.useQuery();

  // Conversational insights mutation
  const generateInsights = trpc.intelligence.generateConversationalInsights.useMutation({
    onSuccess: (data) => {
      setConversationHistory(prev => [...prev, data.primaryInsight]);
    },
  });

  // Market synthesis mutation
  const synthesizeIntelligence = trpc.intelligence.synthesizeMarketIntelligence.useMutation();

  const utils = trpc.useUtils();

  const handleConversationStart = async (trendId: string) => {
    try {
      // Use the tRPC utils to fetch trend data
      const trend = await utils.trends.getById.fetch({ trendId });
      
      if (trend) {
        setCurrentTopic(trend.title);
        setConversationMode(true);
        
        // Generate initial conversational insights
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
                    AI-First Market Intelligence
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Real-time intelligence with multi-agent reasoning
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block"></span>
                  Live Intelligence Active
                </Badge>
                <Button
                  variant="outline"
                  onClick={() => setConversationMode(!conversationMode)}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  {conversationMode ? 'Exit Chat' : 'Start Conversation'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Intelligence Feed */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Intelligence Dashboard */}
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Live Intelligence Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardQuery.data ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {dashboardQuery.data.summary.totalInsights}
                      </div>
                      <div className="text-sm text-gray-600">Active Insights</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(dashboardQuery.data.summary.averageConfidence * 100)}%
                      </div>
                      <div className="text-sm text-gray-600">Avg Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round(dashboardQuery.data.summary.cacheHitRate * 100)}%
                      </div>
                      <div className="text-sm text-gray-600">Cache Hit Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {dashboardQuery.data.systemHealth.agentsOnline}
                      </div>
                      <div className="text-sm text-gray-600">Agents Online</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Market Synthesis Query */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Live Market Intelligence Synthesis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask the AI intelligence system anything about market trends..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        handleMarketSynthesis(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    disabled={synthesizeIntelligence.isPending}
                    onClick={() => {
                      const input = document.querySelector('input') as HTMLInputElement;
                      if (input?.value) {
                        handleMarketSynthesis(input.value);
                        input.value = '';
                      }
                    }}
                  >
                    {synthesizeIntelligence.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Analyze'
                    )}
                  </Button>
                </div>

                {synthesizeIntelligence.data && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
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

                    {synthesizeIntelligence.data.recommendedActions.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <h4 className="font-medium text-sm">Recommended Actions:</h4>
                        {synthesizeIntelligence.data.recommendedActions.slice(0, 3).map((action: string, index: number) => (
                          <div key={index} className="text-xs text-gray-600 flex items-center gap-2">
                            <span className="w-1 h-1 bg-blue-500 rounded-full inline-block"></span>
                            {action}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Intelligent Trend Cards */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                AI-Enhanced Trend Intelligence
              </h2>
              
              <DynamicTrendsSection 
                companyProfile={companyProfile}
                onConversationStart={handleConversationStart}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Company Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Company Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Industry</label>
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
                  <label className="text-sm font-medium text-gray-700">Company Size</label>
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
                  <label className="text-sm font-medium text-gray-700">Tech Maturity</label>
                  <select
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm"
                    value={companyProfile.techMaturity}
                    onChange={(e) => setCompanyProfile(prev => ({ 
                      ...prev, 
                      techMaturity: e.target.value as CompanyProfile['techMaturity']
                    }))}
                  >
                    <option value="low">Low - Basic systems</option>
                    <option value="medium">Medium - Modern stack</option>
                    <option value="high">High - Cutting edge</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Live Market Signals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle className="h-4 w-4" />
                  Live Market Signals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardQuery.data ? (
                  <div className="space-y-3">
                    {dashboardQuery.data.marketSignals.map((signal: { signal: string; strength: string; confidence: number }, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{signal.signal}</span>
                          <Badge 
                            variant={signal.strength === 'strong' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {signal.strength}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600">
                          {Math.round(signal.confidence * 100)}% confidence
                        </div>
                      </div>
                    ))}
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
          </div>
        </div>
      </div>
    </div>
  );
}