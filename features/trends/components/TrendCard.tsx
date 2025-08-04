'use client';

import { Trend } from '../types/trend';
import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';

const cardVariants = cva(
  'rounded-lg border p-6 transition-all hover:shadow-lg cursor-pointer',
  {
    variants: {
      category: {
        consumer: 'border-blue-200 hover:border-blue-400 bg-blue-50/50',
        competition: 'border-purple-200 hover:border-purple-400 bg-purple-50/50',
        economy: 'border-green-200 hover:border-green-400 bg-green-50/50',
        regulation: 'border-orange-200 hover:border-orange-400 bg-orange-50/50',
      },
    },
  }
);

const categoryBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      category: {
        consumer: 'bg-blue-100 text-blue-800',
        competition: 'bg-purple-100 text-purple-800',
        economy: 'bg-green-100 text-green-800',
        regulation: 'bg-orange-100 text-orange-800',
      },
    },
  }
);

interface TrendCardProps {
  trend: Trend;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
  onGenerateNeeds?: () => void;
}

export function TrendCard({ trend, onAnalyze, isAnalyzing, onGenerateNeeds }: TrendCardProps) {
  const impactColor = trend.impact_score >= 8 ? 'text-red-600' : 
                     trend.impact_score >= 5 ? 'text-yellow-600' : 
                     'text-green-600';

  return (
    <div className={cardVariants({ category: trend.category })}>
      <div className="flex items-start justify-between mb-3">
        <span className={categoryBadgeVariants({ category: trend.category })}>
          {trend.category}
        </span>
        <div className="flex items-center gap-1">
          <span className={clsx('text-sm font-semibold', impactColor)}>
            {trend.impact_score}/10
          </span>
          <span className="text-xs text-gray-500">impact</span>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {trend.title}
      </h3>

      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
        {trend.summary}
      </p>

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {trend.source} • {new Date(trend.created_at).toLocaleDateString()}
        </div>

        <div className="flex items-center gap-2">
          {onAnalyze && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAnalyze();
              }}
              disabled={isAnalyzing}
              className={clsx(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                isAnalyzing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              )}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          )}
          
          {onGenerateNeeds && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGenerateNeeds();
              }}
              className="px-3 py-1 text-xs font-medium rounded-md transition-colors bg-green-600 text-white hover:bg-green-700"
            >
              Generate Needs
            </button>
          )}
        </div>
      </div>
    </div>
  );
}