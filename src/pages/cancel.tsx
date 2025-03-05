import React from 'react';
import { useRouter } from 'next/navigation';

const Cancel: React.FC = () => {
  const router = useRouter();

  return (
    <div className="cancel-page">
      <h1>Payment Canceled</h1>
      <p>Your payment was not completed. Please try again.</p>
      <button onClick={() => router.push('/')}>Return to Home</button>
    </div>
  );
};

export default Cancel;