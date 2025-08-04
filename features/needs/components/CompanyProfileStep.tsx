'use client';

import { useState, useEffect } from 'react';
import { useNeedsStore } from '../stores/needsStore';
import { CompanyContext } from '../types/need';
import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';

const inputVariants = cva(
  'mt-1 block w-full rounded-md border px-3 py-2 text-sm transition-colors text-gray-900 placeholder-gray-500 bg-white',
  {
    variants: {
      variant: {
        default: 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 focus:ring-1',
        error: 'border-red-300 focus:border-red-500 focus:ring-red-500 focus:ring-1',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const selectVariants = cva(
  'mt-1 block w-full rounded-md border px-3 py-2 text-sm transition-colors text-gray-900 bg-white',
  {
    variants: {
      variant: {
        default: 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 focus:ring-1',
        error: 'border-red-300 focus:border-red-500 focus:ring-red-500 focus:ring-1',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface CompanyProfileStepProps {
  onNext: () => void;
}

interface FormErrors {
  name?: string;
  industry?: string;
  size?: string;
  techMaturity?: string;
}

export function CompanyProfileStep({ onNext }: CompanyProfileStepProps) {
  const { wizard, updateCompanyContext, completeStep, setError } = useNeedsStore();
  const [formData, setFormData] = useState<Partial<CompanyContext>>(wizard.companyContext);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const industries = [
    { value: 'technology', label: 'Technology' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Financial Services' },
    { value: 'retail', label: 'Retail & E-commerce' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'education', label: 'Education' },
    { value: 'government', label: 'Government' },
    { value: 'other', label: 'Other' },
  ];

  const companySizes = [
    { value: 'startup', label: 'Startup (1-50 employees)' },
    { value: 'small', label: 'Small (51-200 employees)' },
    { value: 'medium', label: 'Medium (201-1000 employees)' },
    { value: 'enterprise', label: 'Enterprise (1000+ employees)' },
  ];

  const techMaturityLevels = [
    { value: 'low', label: 'Low - Limited technology adoption' },
    { value: 'medium', label: 'Medium - Some digital transformation' },
    { value: 'high', label: 'High - Advanced technology integration' },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Company name is required';
    }

    if (!formData.industry) {
      newErrors.industry = 'Please select an industry';
    }

    if (!formData.size) {
      newErrors.size = 'Please select company size';
    }

    if (!formData.techMaturity) {
      newErrors.techMaturity = 'Please select technology maturity level';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Generate company ID if not exists
      const companyId = formData.id || `company_${Date.now()}`;
      const updatedContext = { ...formData, id: companyId };
      
      updateCompanyContext(updatedContext);
      completeStep('company_info');
      onNext();
    } catch (error) {
      setError('Failed to save company information');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CompanyContext, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Company Profile
        </h2>
        <p className="text-sm text-gray-600">
          Help us understand your company to generate relevant business needs.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Name */}
        <div>
          <label htmlFor="company-name" className="block text-sm font-medium text-gray-700">
            Company Name *
          </label>
          <input
            type="text"
            id="company-name"
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={inputVariants({ variant: errors.name ? 'error' : 'default' })}
            placeholder="Enter your company name"
            required
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Industry */}
        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
            Industry *
          </label>
          <select
            id="industry"
            value={formData.industry || ''}
            onChange={(e) => handleInputChange('industry', e.target.value)}
            className={selectVariants({ variant: errors.industry ? 'error' : 'default' })}
            required
          >
            <option value="" className="text-gray-500">Select your industry</option>
            {industries.map((industry) => (
              <option key={industry.value} value={industry.value} className="text-gray-900">
                {industry.label}
              </option>
            ))}
          </select>
          {errors.industry && (
            <p className="mt-1 text-xs text-red-600">{errors.industry}</p>
          )}
        </div>

        {/* Company Size */}
        <div>
          <label htmlFor="size" className="block text-sm font-medium text-gray-700">
            Company Size *
          </label>
          <select
            id="size"
            value={formData.size || ''}
            onChange={(e) => handleInputChange('size', e.target.value)}
            className={selectVariants({ variant: errors.size ? 'error' : 'default' })}
            required
          >
            <option value="" className="text-gray-500">Select company size</option>
            {companySizes.map((size) => (
              <option key={size.value} value={size.value} className="text-gray-900">
                {size.label}
              </option>
            ))}
          </select>
          {errors.size && (
            <p className="mt-1 text-xs text-red-600">{errors.size}</p>
          )}
        </div>

        {/* Technology Maturity */}
        <div>
          <label htmlFor="tech-maturity" className="block text-sm font-medium text-gray-700">
            Technology Maturity *
          </label>
          <select
            id="tech-maturity"
            value={formData.techMaturity || ''}
            onChange={(e) => handleInputChange('techMaturity', e.target.value)}
            className={selectVariants({ variant: errors.techMaturity ? 'error' : 'default' })}
            required
          >
            <option value="" className="text-gray-500">Select technology maturity level</option>
            {techMaturityLevels.map((level) => (
              <option key={level.value} value={level.value} className="text-gray-900">
                {level.label}
              </option>
            ))}
          </select>
          {errors.techMaturity && (
            <p className="mt-1 text-xs text-red-600">{errors.techMaturity}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={clsx(
              'px-6 py-2 text-sm font-medium rounded-md transition-colors',
              isSubmitting
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
            )}
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </form>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              This information helps our AI generate more relevant and personalized business needs for your company.
              All data is kept confidential and used only to improve recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}