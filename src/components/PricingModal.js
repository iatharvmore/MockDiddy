import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { getAuth } from 'firebase/auth';
import { X, Check } from 'lucide-react';

const auth = getAuth();
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const PricingModal = ({ isOpen, onClose }) => {
  const handlePayment = async (priceId) => {
    const stripe = await stripePromise;
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: auth.currentUser?.uid,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const session = await response.json();
      
      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full mx-auto bg-white rounded-lg shadow-lg p-6 overflow-y-auto" style={{ maxHeight: '90vh' }}>
        <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-2xl font-bold text-purple-600">Choose Your Plan</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Single Interview Plan */}
          <div className="relative rounded-xl border p-6 hover:shadow-xl transition-shadow">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Single Interview</h3>
              <div className="text-3xl font-bold text-purple-600 mb-2">₹30</div>
              <p className="text-gray-600">Perfect for quick practice</p>
            </div>
            
            <ul className="space-y-3 mb-6">
              {['1 Full Interview Session', 'Detailed Feedback', 'Performance Report'].map((feature) => (
                <li key={feature} className="flex items-center text-gray-600">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  {feature}
                </li>
              ))}
            </ul>
            
            <button 
              className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
              onClick={() => handlePayment('price_single')}
            >
              Buy Now
            </button>
          </div>

          {/* Bundle Plan */}
          <div className="relative rounded-xl border-2 border-purple-500 p-6 hover:shadow-xl transition-shadow">
            <div className="absolute -top-3 right-4">
              <span className="bg-purple-500 text-white px-3 py-1 rounded">Best Value</span>
            </div>
            
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Interview Bundle</h3>
              <div className="text-3xl font-bold text-purple-600 mb-2">₹100</div>
              <p className="text-gray-600">For serious preparation</p>
            </div>
            
            <ul className="space-y-3 mb-6">
              {[
                '5 Full Interview Sessions',
                'Detailed Feedback',
                'Performance Reports',
                '33% Savings'
              ].map((feature) => (
                <li key={feature} className="flex items-center text-gray-600">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  {feature}
                </li>
              ))}
            </ul>
            
            <button 
              className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
              onClick={() => handlePayment('price_bundle')}
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;