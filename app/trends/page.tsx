'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendFilters } from '@/features/trends';
import { TrendCategory } from '@/features/trends';
import { IntelligentTrendCard } from '@/features/market-intelligence';
import { trpc } from '@/lib/trpc/client';
import { useFeatureFlag } from '@/lib/flags';
import { Download, Brain, AlertCircle } from 'lucide-react';
import { Button } from '@/lib/ui/button';
import { Badge } from '@/lib/ui/badge';

interface CompanyProfile {
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'enterprise';
  techMaturity: 'low' | 'medium' | 'high';
}

export default function TrendsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<TrendCategory | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    industry: 'technology',
    size: 'medium', 
    techMaturity: 'high',
  });

  const exportEnabled = useFeatureFlag('trends.export');

  const { data: trends, isLoading, error } = trpc.trends.list.useQuery({
    category: selectedCategory || undefined,
    limit: 20,
  });

  const exportMutation = trpc.trends.export.useMutation();

  const handleConversationStart = (trendId: string) => {
    // Navigate to the intelligence dashboard with trend context
    router.push(`/intelligence?trendId=${trendId}`);
  };

  const handleExport = () => {
    if (!exportEnabled || !trends) return;
    const trendIds = trends.map((t) => t.id);
    exportMutation.mutate({ format: 'pdf', trendIds });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI-First Trend Intelligence</h1>
              <div className="mt-2 text-gray-600 flex items-center gap-2">
                Real-time AI analysis with multi-agent reasoning
                <Badge variant="outline" className="text-xs">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1 inline-block"></span>
                  Live Intelligence
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/intelligence')}
              className="flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              Intelligence Dashboard
            </Button>
            {exportEnabled && trends && trends.length > 0 && (
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={exportMutation.isPending}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {exportMutation.isPending ? 'Exporting...' : 'Export PDF'}
              </Button>
            )}
          </div>
        </div>

        {/* Company Profile Quick Setup */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              AI Analysis Setup - Configure your company profile for personalized intelligence
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="text-xs font-medium text-gray-700">Tech Maturity</label>
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
          </div>
        </div>

        <TrendFilters
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <p className="text-sm text-red-800">
            Failed to load trends. Please try again later.
          </p>
        </div>
      )}

      {exportMutation.isSuccess && (
        <div className="rounded-md bg-green-50 p-4 mb-6">
          <p className="text-sm text-green-800">
            {exportMutation.data.message}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-white p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {(trends || []).map((trend) => (
            <IntelligentTrendCard
              key={trend.id}
              trend={trend}
              companyProfile={companyProfile}
              onConversationStart={handleConversationStart}
            />
          ))}
          
          {trends && trends.length === 0 && (
            <div className="text-center py-12">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No trends found for the selected category</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}