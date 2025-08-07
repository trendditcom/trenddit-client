/**
 * Intelligent Trend Card
 * Enhanced trend display with conversational interface
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/ui/card';
import { Button } from '@/lib/ui/button';
import { Badge } from '@/lib/ui/badge';
import { Trend } from '@/features/trends/types/trend';
import { Zap } from 'lucide-react';

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
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-gray-800 leading-relaxed">
          {trend.summary}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 pt-2 flex-wrap">
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
            className="flex items-center gap-1 text-xs h-8 px-2"
          >
            <Zap className="h-3 w-3" />
            Needs
          </Button>
        </div>

        {/* Metadata */}
        <div className="text-xs text-gray-700 flex items-center justify-between pt-2 border-t border-gray-100">
          <span>
            Source: <a 
              href={trend.source_url || `https://google.com/search?q=${encodeURIComponent(trend.source)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {trend.source}
            </a>
          </span>
          <span>{new Date(trend.created_at).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}