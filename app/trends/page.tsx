'use client';

import { useState } from 'react';
import { TrendFilters, TrendGrid, TrendAnalyzer } from '@/features/trends';
import { TrendCategory, TrendAnalysis } from '@/features/trends';
import { trpc } from '@/lib/trpc/client';
import { useFeatureFlag } from '@/lib/flags';
import { Download } from 'lucide-react';

export default function TrendsPage() {
  const [selectedCategory, setSelectedCategory] = useState<TrendCategory | null>(null);
  const [analyzingTrendId, setAnalyzingTrendId] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<{
    analysis: TrendAnalysis;
    trendTitle: string;
  } | null>(null);

  const aiAnalysisEnabled = useFeatureFlag('trends.ai_analysis');
  const exportEnabled = useFeatureFlag('trends.export');

  const { data: trends, isLoading, error } = trpc.trends.list.useQuery({
    category: selectedCategory || undefined,
    limit: 20,
  });

  const analyzeMutation = trpc.trends.analyze.useMutation({
    onSuccess: (analysis, variables) => {
      const trend = trends?.find((t) => t.id === variables.trendId);
      if (trend) {
        setCurrentAnalysis({
          analysis,
          trendTitle: trend.title,
        });
      }
      setAnalyzingTrendId(null);
    },
    onError: () => {
      setAnalyzingTrendId(null);
    },
  });

  const exportMutation = trpc.trends.export.useMutation();

  const handleAnalyzeTrend = (trendId: string) => {
    if (!aiAnalysisEnabled) return;
    setAnalyzingTrendId(trendId);
    analyzeMutation.mutate({ trendId });
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Trend Intelligence</h1>
            <p className="mt-2 text-gray-600">
              Track the latest AI trends impacting enterprises across multiple dimensions
            </p>
          </div>
          {exportEnabled && trends && trends.length > 0 && (
            <button
              onClick={handleExport}
              disabled={exportMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {exportMutation.isPending ? 'Exporting...' : 'Export PDF'}
            </button>
          )}
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
        <TrendGrid
          trends={trends || []}
          onAnalyzeTrend={aiAnalysisEnabled ? handleAnalyzeTrend : undefined}
          analyzingTrendId={analyzingTrendId}
        />
      )}

      {currentAnalysis && (
        <TrendAnalyzer
          analysis={currentAnalysis.analysis}
          trendTitle={currentAnalysis.trendTitle}
          onClose={() => setCurrentAnalysis(null)}
        />
      )}
    </div>
  );
}