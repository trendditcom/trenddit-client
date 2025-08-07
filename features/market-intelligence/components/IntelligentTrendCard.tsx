/**
 * Intelligent Trend Card
 * Enhanced trend display consistent with row view styling
 */

'use client';

import { Card, CardContent, CardHeader } from '@/lib/ui/card';
import { Button } from '@/lib/ui/button';
import { Badge } from '@/lib/ui/badge';
import { Trend } from '@/features/trends/types/trend';
import { 
  Zap, 
  ExternalLink, 
  Calendar 
} from 'lucide-react';

interface IntelligentTrendCardProps {
  trend: Trend;
  companyProfile?: {
    industry: string;
    size: 'startup' | 'small' | 'medium' | 'enterprise';
    techMaturity: 'low' | 'medium' | 'high';
  };
  onGenerateNeeds?: (trendId: string) => void;
}

export function IntelligentTrendCard({ 
  trend, 
  companyProfile,
  onGenerateNeeds
}: IntelligentTrendCardProps) {
  
  // Consistent color functions from TrendRowView
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'consumer': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'competition': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'economy': return 'bg-green-100 text-green-800 border-green-200';
      case 'regulation': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLeftBorderColor = (category: string) => {
    switch (category) {
      case 'consumer': return 'border-l-blue-500';
      case 'competition': return 'border-l-purple-500';
      case 'economy': return 'border-l-green-500';
      case 'regulation': return 'border-l-orange-500';
      default: return 'border-l-gray-500';
    }
  };

  const getImpactColor = (score: number) => {
    if (score >= 8) return 'text-red-600 bg-red-50';
    if (score >= 5) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <Card className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg border-l-4 ${getLeftBorderColor(trend.category)}`}>
      <CardHeader className="pb-3">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-base mb-3">
          {trend.title}
        </h3>
        
        {/* Metadata badges - consistent with row view */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`text-xs ${getCategoryColor(trend.category)}`}>
            {trend.category}
          </Badge>
          
          <div className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(trend.impact_score)}`}>
            Impact: {trend.impact_score}/10
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary */}
        <p className="text-sm text-gray-800 leading-relaxed">
          {trend.summary}
        </p>

        {/* Action Button - consistent with row view */}
        <div className="flex items-center justify-between gap-2">
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
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Generate Needs
          </Button>
        </div>

        {/* Footer Metadata - consistent with row view */}
        <div className="text-xs text-gray-600 pt-3 border-t border-gray-100 space-y-2">
          {/* Date */}
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(trend.created_at).toLocaleDateString()}</span>
          </div>
          
          {/* Clickable Source - consistent with row view */}
          {trend.source_url ? (
            <a 
              href={trend.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline inline-flex"
            >
              <ExternalLink className="h-3 w-3" />
              <span>{trend.source}</span>
            </a>
          ) : (
            <span className="text-gray-600 text-xs">{trend.source}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}