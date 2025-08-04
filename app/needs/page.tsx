'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { NeedWizard } from '@/features/needs';
import { useFlags } from '@/lib/flags';

function NeedsPageContent() {
  const searchParams = useSearchParams();
  const trendId = searchParams.get('trendId');
  const flags = useFlags();
  const [showWizard, setShowWizard] = useState(true);

  // Check if needs feature is enabled
  if (!flags.needs?.enabled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <h2 className="mt-2 text-lg font-medium text-gray-900">Feature Not Available</h2>
          <p className="mt-1 text-sm text-gray-500">
            The Need Discovery feature is currently disabled. Please check back later.
          </p>
          <div className="mt-6">
            <a
              href="/trends"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Back to Trends
            </a>
          </div>
        </div>
      </div>
    );
  }

  const handleWizardComplete = (needs: unknown[]) => {
    console.log('Wizard completed with needs:', needs);
    setShowWizard(false);
    // TODO: Navigate to needs dashboard or results page
  };

  const handleWizardCancel = () => {
    // Navigate back to trends page
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        {showWizard ? (
          <NeedWizard
            selectedTrendId={trendId || undefined}
            onComplete={handleWizardComplete}
            onCancel={handleWizardCancel}
          />
        ) : (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                Need Discovery Complete!
              </h2>
              <p className="mt-2 text-gray-600">
                We&apos;ve successfully generated and prioritized your business needs. 
                Next, we&apos;ll help you find solutions to address these needs.
              </p>
              <div className="mt-6 flex items-center justify-center space-x-4">
                <button
                  onClick={() => setShowWizard(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Run Again
                </button>
                <button
                  disabled
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 opacity-50 cursor-not-allowed"
                >
                  Find Solutions (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NeedsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <NeedsPageContent />
    </Suspense>
  );
}