'use client';

import { useState } from 'react';
import { Trend } from '../types/trend';
import { Button } from '@/lib/ui/button';
import { Badge } from '@/lib/ui/badge';
import { trpc } from '@/lib/trpc/client';
import { 
  TrendingUp, 
  MessageCircle, 
  ExternalLink, 
  Calendar,
  Target,
  Loader2,
  ChevronRight,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface CompanyProfile {
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'enterprise';
  techMaturity: 'low' | 'medium' | 'high';
}

interface TrendRowViewProps {
  trends: Trend[];
  companyProfile?: CompanyProfile;
  onConversationStart?: (trendId: string) => void;
  onGenerateNeeds?: (trendId: string) => void;
  onAnalyzeTrend?: (trendId: string) => void;
  analyzingTrendId?: string | null;
}

export function TrendRowView({ 
  trends, 
  companyProfile,
  onConversationStart,
  onGenerateNeeds,
  onAnalyzeTrend,
  analyzingTrendId
}: TrendRowViewProps) {
  const [expandedTrend, setExpandedTrend] = useState<string | null>(null);
  const [intelligenceData, setIntelligenceData] = useState<Record<string, any>>({});
  const [currentAnalysisTrendId, setCurrentAnalysisTrendId] = useState<string | null>(null);

  const predictRelevance = trpc.intelligence.predictTrendRelevance.useMutation({
    onSuccess: (data) => {
      if (currentAnalysisTrendId) {
        setIntelligenceData(prev => ({ ...prev, [currentAnalysisTrendId]: data }));
      }
    },
    onError: (error) => {
      console.error('Relevance prediction failed:', error);
    },
  });

  const handleIntelligentAnalysis = async (trendId: string) => {
    if (!companyProfile) return;
    
    setCurrentAnalysisTrendId(trendId);
    predictRelevance.mutate({
      companyProfile,
      timeHorizon: '6months',
      confidenceThreshold: 0.7,
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'consumer': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'competition': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'economy': return 'bg-green-100 text-green-800 border-green-200';
      case 'regulation': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactColor = (score: number) => {
    if (score >= 8) return 'text-red-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getUrgencyIcon = (timeline: string) => {
    if (timeline.includes('Critical')) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (timeline.includes('Opportunity')) return <TrendingUp className="h-4 w-4 text-blue-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  if (trends.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No trends found for the selected criteria</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {trends.map((trend) => {
        const isExpanded = expandedTrend === trend.id;
        const intelligence = intelligenceData[trend.id];
        const isAnalyzing = analyzingTrendId === trend.id;

        return (
          <div 
            key={trend.id} 
            className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200"
          >
            {/* Main Row Content */}
            <div className="p-4">
              <div className="grid grid-cols-12 gap-4 items-center">
                
                {/* Category & Impact - Col 1-2 */}
                <div className="col-span-2 space-y-2">
                  <Badge className={`text-xs ${getCategoryColor(trend.category)}`}>
                    {trend.category}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3 text-gray-400" />
                    <span className={`text-sm font-medium ${getImpactColor(trend.impact_score)}`}>
                      {trend.impact_score}/10
                    </span>
                  </div>
                </div>

                {/* Title & Summary - Col 3-6 */}
                <div className="col-span-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                    {trend.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {trend.summary}
                  </p>
                </div>

                {/* AI Intelligence Indicators - Col 7-8 */}
                <div className="col-span-2">
                  {intelligence && intelligence.relevantTrends?.length > 0 && (
                    <div className="space-y-1">
                      {intelligence.relevantTrends.slice(0, 2).map((relevantTrend: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <Badge 
                            className={`text-xs ${getRelevanceColor(relevantTrend.relevanceScore)}`}
                          >
                            {Math.round(relevantTrend.relevanceScore * 100)}%
                          </Badge>
                          {getUrgencyIcon(relevantTrend.timelineImpact)}
                        </div>
                      ))}
                    </div>
                  )}
                  {!intelligence && companyProfile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleIntelligentAnalysis(trend.id)}
                      disabled={predictRelevance.isPending}
                      className="text-xs py-1 px-2 h-auto"
                    >
                      {predictRelevance.isPending && currentAnalysisTrendId === trend.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        'AI Analysis'
                      )}
                    </Button>
                  )}
                </div>

                {/* Metadata - Col 9-10 */}
                <div className="col-span-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1 mb-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(trend.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    {trend.source}
                  </div>
                </div>

                {/* Actions - Col 11-12 */}
                <div className="col-span-2 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onConversationStart?.(trend.id)}
                    className="flex items-center gap-1 text-xs py-1 px-2 h-auto"
                  >
                    <MessageCircle className="h-3 w-3" />
                    Chat
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedTrend(isExpanded ? null : trend.id)}
                    className="p-1 h-auto"
                  >
                    <ChevronRight 
                      className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                    />
                  </Button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                  
                  {/* Full Summary */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Detailed Analysis</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {trend.summary}
                    </p>
                  </div>

                  {/* AI Intelligence Section */}
                  {intelligence && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse inline-block"></span>
                        <span className="text-sm font-medium text-blue-900">
                          AI Intelligence Analysis
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(intelligence.overallConfidence * 100)}% confidence
                        </Badge>
                      </div>

                      {intelligence.relevantTrends?.map((relevantTrend: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">
                              {relevantTrend.timelineImpact}
                            </span>
                            <span className="text-xs text-gray-500">
                              {Math.round(relevantTrend.relevanceScore * 100)}% match
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {relevantTrend.reasoning}
                          </p>
                        </div>
                      ))}

                      {/* Chain of Thought Reasoning */}
                      {intelligence.reasoningChain && intelligence.reasoningChain.length > 0 && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-blue-700 hover:text-blue-800 font-medium">
                            View AI Reasoning Chain
                          </summary>
                          <div className="mt-2 space-y-2 pl-4 border-l-2 border-blue-200">
                            {intelligence.reasoningChain.map((step: any, index: number) => (
                              <div key={index} className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    Step {step.step}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {Math.round(step.confidence * 100)}% confidence
                                  </span>
                                </div>
                                <p className="text-xs text-gray-700">{step.description}</p>
                                {step.evidence.length > 0 && (
                                  <ul className="text-xs text-gray-600 pl-4">
                                    {step.evidence.map((evidence: string, evidenceIndex: number) => (
                                      <li key={evidenceIndex} className="list-disc">
                                        {evidence}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    {onAnalyzeTrend && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAnalyzeTrend(trend.id)}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2"
                      >
                        {isAnalyzing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <TrendingUp className="h-4 w-4" />
                        )}
                        Analyze Impact
                      </Button>
                    )}

                    <Button
                      size="sm"
                      onClick={() => onGenerateNeeds?.(trend.id)}
                      className="flex items-center gap-2"
                    >
                      <Target className="h-4 w-4" />
                      Generate Needs
                    </Button>

                    {trend.source_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(trend.source_url, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Source
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}