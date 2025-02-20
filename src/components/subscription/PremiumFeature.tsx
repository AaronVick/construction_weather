// src/components/subscription/PremiumFeature.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Star } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useSubscription } from '../../hooks/useSubscription';
import Button from '../ui/Button';

interface PremiumFeatureProps {
  children: React.ReactNode;
  requiredPlan: 'premium' | 'enterprise';
  fallback?: React.ReactNode;
  hideUpgradeButton?: boolean;
  showMessage?: boolean;
  className?: string;
}

const PremiumFeature: React.FC<PremiumFeatureProps> = ({
  children,
  requiredPlan,
  fallback,
  hideUpgradeButton = false,
  showMessage = true,
  className = '',
}) => {
  const { darkMode } = useTheme();
  const { subscription } = useSubscription();
  const navigate = useNavigate();
  
  // Check if the user's current plan meets the requirement
  const hasAccess = 
    (requiredPlan === 'premium' && 
      (subscription.plan === 'premium' || subscription.plan === 'enterprise')) ||
    (requiredPlan === 'enterprise' && subscription.plan === 'enterprise');
  
  const handleUpgrade = () => {
    navigate('/dashboard/subscription');
  };
  
  // If the user has access, render the children
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // If a fallback is provided, render it
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Otherwise, render a premium feature banner
  return (
    <div
      className={`
        rounded-lg border overflow-hidden
        ${darkMode 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-gray-50 border-gray-200'
        }
        ${className}
      `}
    >
      <div className="p-6 flex flex-col items-center justify-center text-center">
        <div 
          className={`
            p-3 rounded-full mb-4
            ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}
          `}
        >
          {requiredPlan === 'premium' ? (
            <Star className={`h-8 w-8 ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
          ) : (
            <Lock className={`h-8 w-8 ${darkMode ? 'text-purple-400' : 'text-purple-500'}`} />
          )}
        </div>
        
        <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {requiredPlan === 'premium' 
            ? 'Premium Feature'
            : 'Enterprise Feature'
          }
        </h3>
        
        {showMessage && (
          <p className={`text-sm mb-4 max-w-md ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {requiredPlan === 'premium'
              ? `This feature is available on our Premium and Enterprise plans. Upgrade to access multiple jobsites, advanced analytics, and priority support.`
              : `This feature is only available on our Enterprise plan. Upgrade to access unlimited jobsites, white labeling, and dedicated support.`
            }
          </p>
        )}
        
        {!hideUpgradeButton && (
          <Button
            variant="primary"
            onClick={handleUpgrade}
            className="mt-2"
          >
            Upgrade Now
          </Button>
        )}
      </div>
    </div>
  );
};

export default PremiumFeature;