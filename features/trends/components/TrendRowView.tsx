'use client';

import { useState } from 'react';
import { Trend } from '../types/trend';
import { Button } from '@/lib/ui/button';
import { Badge } from '@/lib/ui/badge';
import { 
  TrendingUp, 
  ExternalLink, 
  Calendar,
  Target,
  ChevronRight
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
    if (score >= 8) return 'text-red-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-green-600';
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
    <div className="space-y-2">
      {trends.map((trend) => {
        const isExpanded = expandedTrend === trend.id;

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
                  <p className="text-sm text-gray-800 line-clamp-2">
                    {trend.summary}
                  </p>
                </div>

                {/* Spacer - Col 7-8 */}
                <div className="col-span-2">
                  {/* Empty spacer for layout */}
                </div>

                {/* Metadata - Col 9-10 */}
                <div className="col-span-2 text-xs text-gray-700">
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
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {trend.summary}
                    </p>
                  </div>


                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">

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