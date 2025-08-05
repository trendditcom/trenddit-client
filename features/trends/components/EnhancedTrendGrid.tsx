'use client';

import { Trend } from '../types/trend';
import { IntelligentTrendCard } from '@/features/market-intelligence';
import { TrendingUp } from 'lucide-react';

interface CompanyProfile {
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'enterprise';
  techMaturity: 'low' | 'medium' | 'high';
}

interface EnhancedTrendGridProps {
  trends: Trend[];
  companyProfile?: CompanyProfile;
  onConversationStart?: (trendId: string) => void;
  onGenerateNeeds?: (trendId: string) => void;
  onAnalyzeTrend?: (trendId: string) => void;
  analyzingTrendId?: string | null;
}

export function EnhancedTrendGrid({ 
  trends, 
  companyProfile,
  onConversationStart,
  onGenerateNeeds,
  onAnalyzeTrend,
  analyzingTrendId
}: EnhancedTrendGridProps) {
  if (trends.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-700 font-medium">No trends found for the selected criteria</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trends.map((trend) => (
        <IntelligentTrendCard
          key={trend.id}
          trend={trend}
          companyProfile={companyProfile}
          onConversationStart={onConversationStart}
          onGenerateNeeds={onGenerateNeeds}
          onAnalyzeTrend={onAnalyzeTrend}
          isAnalyzing={analyzingTrendId === trend.id}
        />
      ))}
    </div>
  );
}