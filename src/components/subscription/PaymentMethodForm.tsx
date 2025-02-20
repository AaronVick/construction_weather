// src/components/subscription/PaymentMethodForm.tsx
import React, { useState } from 'react';
import Button from '../ui/Button';

interface PaymentMethodFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({ 
  onSubmit,
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    name: '',
    zipCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      setFormData({ ...formData, [name]: formatted });
      return;
    }
    
    // Format expiry date with slash
    if (name === 'expiryDate') {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length <= 2) {
        setFormData({ ...formData, [name]: cleaned });
      } else {
        const formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
        setFormData({ ...formData, [name]: formatted });
      }
      return;
    }
    
    setFormData({ ...formData, [name]: value });
    
    // Clear error when field is modified
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate card number
    const cardNumberDigits = formData.cardNumber.replace(/\D/g, '');
    if (!cardNumberDigits) {
      newErrors.cardNumber = 'Card number is required';
    } else if (cardNumberDigits.length !== 16) {
      newErrors.cardNumber = 'Card number must be 16 digits';
    }
    
    // Validate expiry date
    const expiryParts = formData.expiryDate.split('/');
    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) {
      newErrors.expiryDate = 'Expiry date must be in MM/YY format';
    } else {
      const month = parseInt(expiryParts[0], 10);
      const year = parseInt(`20${expiryParts[1]}`, 10);
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      if (month < 1 || month > 12) {
        newErrors.expiryDate = 'Month must be between 1 and 12';
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        newErrors.expiryDate = 'Card has expired';
      }
    }
    
    // Validate CVC
    if (!formData.cvc) {
      newErrors.cvc = 'CVC is required';
    } else if (formData.cvc.length < 3 || formData.cvc.length > 4) {
      newErrors.cvc = 'CVC must be 3 or 4 digits';
    }
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Validate zip code
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSubmit();
    } catch (error) {
      console.error('Error saving payment method:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="cardNumber" className="block text-sm font-medium mb-1">
          Card Number
        </label>
        <input
          type="text"
          id="cardNumber"
          name="cardNumber"
          value={formData.cardNumber}
          onChange={handleChange}
          placeholder="4242 4242 4242 4242"
          maxLength={19}
          className={`
            block w-full rounded-md shadow-sm text-sm
            ${errors.cardNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}
          `}
        />
        {errors.cardNumber && (
          <p className="mt-1 text-sm text-red-500">{errors.cardNumber}</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="expiryDate" className="block text-sm font-medium mb-1">
            Expiry Date
          </label>
          <input
            type="text"
            id="expiryDate"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            placeholder="MM/YY"
            maxLength={5}
            className={`
              block w-full rounded-md shadow-sm text-sm
              ${errors.expiryDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}
            `}
          />
          {errors.expiryDate && (
            <p className="mt-1 text-sm text-red-500">{errors.expiryDate}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="cvc" className="block text-sm font-medium mb-1">
            CVC
          </label>
          <input
            type="text"
            id="cvc"
            name="cvc"
            value={formData.cvc}
            onChange={handleChange}
            placeholder="123"
            maxLength={4}
            className={`
              block w-full rounded-md shadow-sm text-sm
              ${errors.cvc ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}
            `}
          />
          {errors.cvc && (
            <p className="mt-1 text-sm text-red-500">{errors.cvc}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium mb-1">
            ZIP Code
          </label>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            placeholder="10001"
            className={`
              block w-full rounded-md shadow-sm text-sm
              ${errors.zipCode ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}
            `}
          />
          {errors.zipCode && (
            <p className="mt-1 text-sm text-red-500">{errors.zipCode}</p>
          )}
        </div>
      </div>
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name on Card
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="John Smith"
          className={`
            block w-full rounded-md shadow-sm text-sm
            ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}
`}
/>
{errors.name && (
<p className="mt-1 text-sm text-red-500">{errors.name}</p>
)}
</div>

<div className="flex justify-end space-x-3 mt-6">
    <Button
      variant="outline"
      onClick={onCancel}
      type="button"
    >
      Cancel
    </Button>
    <Button
      variant="primary"
      type="submit"
      loading={loading}
      disabled={loading}
    >
      Save Payment Method
    </Button>
  </div>
</form>
);
};

export default PaymentMethodForm;