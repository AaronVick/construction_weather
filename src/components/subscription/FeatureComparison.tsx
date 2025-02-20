// src/components/subscription/FeatureComparison.tsx
import React from 'react';

interface Feature {
  name: string;
  description: string;
  basic: boolean | string;
  premium: boolean | string;
  enterprise: boolean | string;
  icon?: React.ReactNode;
}

interface FeatureCategory {
  category: string;
  features: Feature[];
}

interface FeatureComparisonProps {
  features: FeatureCategory[];
}

const FeatureComparison: React.FC<FeatureComparisonProps> = ({ features }) => {
  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      if (value) {
        return (
          <div className="flex justify-center">
            <svg 
              className="h-5 w-5 text-green-500" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        );
      }
      return (
        <div className="flex justify-center">
          <svg 
            className="h-5 w-5 text-gray-400" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }
    
    return <div className="text-center text-sm">{value}</div>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Feature
            </th>
            <th scope="col" className="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Basic
            </th>
            <th scope="col" className="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Premium
            </th>
            <th scope="col" className="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Enterprise
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {features.map((category, categoryIndex) => (
            <React.Fragment key={categoryIndex}>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <td 
                  colSpan={4}
                  className="py-2 px-6 text-sm font-medium"
                >
                  {category.category}
                </td>
              </tr>
              {category.features.map((feature, featureIndex) => (
                <tr key={`${categoryIndex}-${featureIndex}`}>
                  <td className="py-4 px-6">
                    <div className="flex items-start">
                      {feature.icon && (
                        <div className="mr-3 flex-shrink-0">
                          {feature.icon}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium">
                          {feature.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {feature.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {renderFeatureValue(feature.basic)}
                  </td>
                  <td className="py-4 px-6">
                    {renderFeatureValue(feature.premium)}
                  </td>
                  <td className="py-4 px-6">
                    {renderFeatureValue(feature.enterprise)}
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FeatureComparison;