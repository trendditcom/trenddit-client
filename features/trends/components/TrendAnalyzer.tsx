'use client';

import { TrendAnalysis } from '../types/trend';
import { X } from 'lucide-react';

interface TrendAnalyzerProps {
  analysis: TrendAnalysis | null;
  trendTitle: string;
  onClose: () => void;
}

export function TrendAnalyzer({ analysis, trendTitle, onClose }: TrendAnalyzerProps) {
  if (!analysis) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">AI Analysis</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Trend</h3>
            <p className="text-lg font-medium">{trendTitle}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Business Implications</h3>
            <p className="text-gray-700">{analysis.businessImplications}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Technical Requirements</h3>
            <p className="text-gray-700 whitespace-pre-line">{analysis.technicalRequirements}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Implementation Timeline</h3>
            <p className="text-gray-700">{analysis.implementationTimeline}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Risk Factors</h3>
            <ul className="space-y-1">
              {analysis.riskFactors.map((risk, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span className="text-gray-700">{risk}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Impact Score</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${analysis.impactScore * 10}%` }}
                />
              </div>
              <span className="text-lg font-semibold">{analysis.impactScore}/10</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}