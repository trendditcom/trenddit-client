'use client';

import { useState } from 'react';
import { Trend } from '../types/trend';
import { Button } from '@/lib/ui/button';
import { Badge } from '@/lib/ui/badge';
import { 
  TrendingUp, 
  ExternalLink, 
  Calendar,
  ChevronDown,
  Zap
} from 'lucide-react';

interface CompanyProfile {
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'enterprise';
  techMaturity: 'low' | 'medium' | 'high';
}

interface TrendRowViewProps {
  trends: Trend[];
  companyProfile?: CompanyProfile;
  onGenerateNeeds?: (trendId: string) => void;
}

export function TrendRowView({ 
  trends, 
  companyProfile,
  onGenerateNeeds,
}: TrendRowViewProps) {
  const [expandedTrend, setExpandedTrend] = useState<string | null>(null);

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
    if (score >= 8) return 'text-red-600 bg-red-50';
    if (score >= 5) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (trends.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-700 font-medium">No trends found for the selected criteria</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {trends.map((trend) => {
        const isExpanded = expandedTrend === trend.id;

        return (
          <div 
            key={trend.id} 
            className="bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200"
          >
            {/* Main Row Content */}
            <div className="p-5">
              <div className="flex items-start gap-4">
                
                {/* Expand/Collapse Button - Left side for better UX */}
                <button
                  onClick={() => setExpandedTrend(isExpanded ? null : trend.id)}
                  className="mt-1 p-1 rounded hover:bg-gray-100 transition-colors"
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  <ChevronDown 
                    className={`h-5 w-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                  />
                </button>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    
                    {/* Left Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title - Full width, no truncation */}
                      <h3 className="font-semibold text-gray-900 text-base mb-2">
                        {trend.title}
                      </h3>
                      
                      {/* Metadata Row */}
                      <div className="flex items-center gap-4 text-sm">
                        <Badge className={`text-xs ${getCategoryColor(trend.category)}`}>
                          {trend.category}
                        </Badge>
                        
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(trend.impact_score)}`}>
                          Impact: {trend.impact_score}/10
                        </div>
                        
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(trend.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        {/* Clickable Source */}
                        <a 
                          href={trend.source_url || `https://google.com/search?q=${encodeURIComponent(trend.source)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>{trend.source}</span>
                        </a>
                      </div>
                    </div>

                    {/* Right Actions - Always Visible */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => onGenerateNeeds?.(trend.id)}
                        className="flex items-center gap-2"
                      >
                        <Zap className="h-4 w-4" />
                        Generate Needs
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 ml-9 pt-4 border-t border-gray-100">
                  <div className="space-y-4">
                    {/* Full Summary */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {trend.summary}
                      </p>
                    </div>

                    {/* Additional Actions */}
                    <div className="flex items-center gap-3 pt-2">
                      {trend.source_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(trend.source_url, '_blank')}
                          className="flex items-center gap-2 text-xs"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Full Article
                        </Button>
                      )}
                    </div>
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