/**
 * Intelligent Trend Card
 * Enhanced trend display with AI-first intelligence and conversational interface
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/ui/card';
import { Button } from '@/lib/ui/button';
import { Badge } from '@/lib/ui/badge';
import { trpc } from '@/lib/trpc/client';
import { Trend } from '@/features/trends/types/trend';
import { Loader2, MessageCircle, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface IntelligentTrendCardProps {
  trend: Trend;
  companyProfile?: {
    industry: string;
    size: 'startup' | 'small' | 'medium' | 'enterprise';
    techMaturity: 'low' | 'medium' | 'high';
  };
  onConversationStart?: (trendId: string) => void;
  onGenerateNeeds?: (trendId: string) => void;
  onAnalyzeTrend?: (trendId: string) => void;
  isAnalyzing?: boolean;
}

export function IntelligentTrendCard({ 
  trend, 
  companyProfile,
  onConversationStart,
  onGenerateNeeds,
  onAnalyzeTrend,
  isAnalyzing = false
}: IntelligentTrendCardProps) {
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [intelligence, setIntelligence] = useState<any>(null);

  const predictRelevance = trpc.intelligence.predictTrendRelevance.useMutation({
    onSuccess: (data) => {
      setIntelligence(data);
      setShowIntelligence(true);
    },
    onError: (error) => {
      console.error('Relevance prediction failed:', error);
    },
  });

  const handleIntelligentAnalysis = async () => {
    if (!companyProfile) return;
    
    predictRelevance.mutate({
      companyProfile,
      timeHorizon: '6months',
      confidenceThreshold: 0.7,
    });
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

  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-lg border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
              {trend.title}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {trend.category}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Impact: {trend.impact_score}/10
              </Badge>
            </div>
          </div>
          
          {/* AI-First Intelligence Indicators */}
          <div className="flex flex-col items-end gap-2">
            {intelligence && (
              <div className="text-right space-y-1">
                {intelligence.relevantTrends.map((relevantTrend: any, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge 
                      className={`text-xs ${getRelevanceColor(relevantTrend.relevanceScore)}`}
                    >
                      {Math.round(relevantTrend.relevanceScore * 100)}% relevant
                    </Badge>
                    {getUrgencyIcon(relevantTrend.timelineImpact)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          {trend.summary}
        </p>

        {/* AI Intelligence Section */}
        {showIntelligence && intelligence && (
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

            {intelligence.relevantTrends.map((relevantTrend: any, index: number) => (
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
        <div className="flex items-center gap-2 pt-2">
          {companyProfile && !showIntelligence && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleIntelligentAnalysis}
              disabled={predictRelevance.isPending}
              className="flex items-center gap-2"
            >
              {predictRelevance.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              AI Analysis
            </Button>
          )}

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
            variant="outline"
            size="sm"
            onClick={() => onConversationStart?.(trend.id)}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Discuss
          </Button>

          <Button
            size="sm"
            onClick={() => {
              if (onGenerateNeeds) {
                onGenerateNeeds(trend.id);
              } else {
                // Fallback to navigation for backward compatibility
                window.location.href = `/needs?trendId=${trend.id}`;
              }
            }}
          >
            Generate Needs
          </Button>
        </div>

        {/* Metadata */}
        <div className="text-xs text-gray-500 flex items-center justify-between pt-2 border-t border-gray-100">
          <span>Source: {trend.source}</span>
          <span>{new Date(trend.created_at).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}