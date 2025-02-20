// src/components/subscription/UpgradePrompt.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Check } from 'lucide-react';
import Button from '../ui/Button';
import { useTheme } from '../../hooks/useTheme';
import { useSubscription } from '../../hooks/useSubscription';

interface UpgradePromptProps {
  title?: string;
  description?: string;
  features?: string[];
  targetPlan?: 'premium' | 'enterprise';
  compact?: boolean;
  className?: string;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  title,
  description,
  features,
  targetPlan = 'premium',
  compact = false,
  className = '',
}) => {
  const theme = useTheme();
const darkMode = theme ? theme.darkMode : false;
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  
  // If user already has the target plan or higher, don't show the prompt
  if (
    (targetPlan === 'premium' && 
      (subscription.plan === 'premium' || subscription.plan === 'enterprise')) ||
    (targetPlan === 'enterprise' && subscription.plan === 'enterprise')
  ) {
    return null;
  }
  
  // Default messaging
  const defaultTitle = targetPlan === 'premium'
    ? 'Upgrade to Premium'
    : 'Upgrade to Enterprise';
    
  const defaultDescription = targetPlan === 'premium'
    ? 'Get access to advanced features and unlock more possibilities for your business.'
    : 'Scale your operations with our comprehensive Enterprise plan.';
    
  const defaultFeatures = targetPlan === 'premium'
    ? [
        'Multiple jobsites (up to 10)',
        'Advanced analytics',
        'Custom email templates',
        'Priority support'
      ]
    : [
        'Unlimited jobsites',
        'White labeling',
        'Custom workflows',
        'Dedicated support'
      ];
  
  const displayTitle = title || defaultTitle;
  const displayDescription = description || defaultDescription;
  const displayFeatures = features || defaultFeatures;
  
  const handleUpgradeClick = () => {
    navigate('/dashboard/subscription');
  };
  
  if (compact) {
    return (
      <div
        className={`
          rounded-lg overflow-hidden
          ${darkMode ? 'bg-gradient-to-br from-blue-900 to-indigo-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200'}
          ${className}
        `}
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Star className={`mr-2 ${darkMode ? 'text-yellow-300' : 'text-yellow-500'}`} size={20} />
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-blue-800'}`}>
              {displayTitle}
            </span>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleUpgradeClick}
          >
            Upgrade
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div
      className={`
        rounded-lg overflow-hidden
        ${darkMode ? 'bg-gradient-to-br from-blue-900 to-indigo-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200'}
        ${className}
      `}
    >
      <div className="p-6">
        <div className="flex items-center mb-4">
          <Star className={`mr-2 ${darkMode ? 'text-yellow-300' : 'text-yellow-500'}`} size={24} />
          <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-blue-800'}`}>
            {displayTitle}
          </h3>
        </div>
        
        <p className={`mb-4 ${darkMode ? 'text-blue-100' : 'text-blue-700'}`}>
          {displayDescription}
        </p>
        
        <ul className="space-y-2 mb-6">
          {displayFeatures.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check 
                size={16} 
                className={`mt-0.5 mr-2 ${darkMode ? 'text-green-300' : 'text-green-500'}`}
              />
              <span className={darkMode ? 'text-blue-100' : 'text-blue-700'}>
                {feature}
              </span>
            </li>
          ))}
        </ul>
        
        <Button
          variant="primary"
          className="w-full"
          onClick={handleUpgradeClick}
        >
          Upgrade Now
        </Button>
      </div>
    </div>
  );
};

export default UpgradePrompt;