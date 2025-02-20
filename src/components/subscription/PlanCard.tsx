// src/components/subscription/PlanCard.tsx
import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { SubscriptionPlan, BillingCycle } from '../../types/subscription';
import Button from '../ui/Button';

interface PlanCardProps {
  plan: {
    id: SubscriptionPlan;
    name: string;
    description: string;
    price: {
      monthly: number;
      annually: number;
    };
    features: string[];
    limitations?: string[];
    icon: React.ReactNode;
    recommendedFor: string;
  };
  billingCycle: BillingCycle;
  isCurrentPlan: boolean;
  onSelect: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  billingCycle,
  isCurrentPlan,
  onSelect,
}) => {
  const theme = useTheme();
const darkMode = theme ? theme.darkMode : false;
  
  const price = billingCycle === 'monthly' 
    ? plan.price.monthly
    : plan.price.annually;
    
  const planClasses = `relative flex flex-col h-full p-6 rounded-lg border-2 transition-all ${
    isCurrentPlan 
      ? 'border-blue-500 dark:border-blue-400 shadow-md' 
      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
  }`;

  return (
    <div className={planClasses}>
      {isCurrentPlan && (
        <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/2">
          <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
            Current Plan
          </span>
        </div>
      )}
      
      <div className="flex items-center mb-4">
        <div className={`mr-3 p-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          {plan.icon}
        </div>
        <h3 className="text-xl font-semibold">{plan.name}</h3>
      </div>
      
      <p className={`mb-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {plan.description}
      </p>
      
      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-3xl font-bold">${price}</span>
          <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
            /{billingCycle === 'monthly' ? 'mo' : 'yr'}
          </span>
        </div>
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {plan.recommendedFor}
        </div>
      </div>
      
      <div className="flex-grow mb-6">
        <h4 className="text-sm font-medium mb-3">Features</h4>
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start text-sm">
              <span className="text-green-500 mr-2 mt-0.5">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        
        {plan.limitations && plan.limitations.length > 0 && (
          <>
            <h4 className="text-sm font-medium mt-4 mb-2">Limitations</h4>
            <ul className="space-y-2">
              {plan.limitations.map((limitation, index) => (
                <li key={index} className="flex items-start text-sm text-gray-500 dark:text-gray-400">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      
      <Button
        variant={isCurrentPlan ? 'outline' : 'primary'}
        className="w-full"
        onClick={onSelect}
        disabled={isCurrentPlan}
      >
        {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
      </Button>
    </div>
  );
};

export default PlanCard;