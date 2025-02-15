import React from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

function PricingModal({ isOpen, onClose, onSelectPlan }) {
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
          userId: auth.currentUser.uid,
        }),
      });
      
      const session = await response.json();
      
      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });
      
      if (result.error) {
        alert(result.error.message);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 animate-fade-in">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              Choose Your Plan
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Single Interview Plan */}
            <div className="glass-card p-6 hover:shadow-xl transition-shadow">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Single Interview</h3>
                <div className="text-3xl font-bold text-purple-600 mb-2">₹30</div>
                <p className="text-gray-600">Perfect for quick practice</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  1 Full Interview Session
                </li>
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Detailed Feedback
                </li>
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Performance Report
                </li>
              </ul>
              <button
                onClick={() => handlePayment('price_single')}
                className="w-full btn btn-primary"
              >
                Buy Now
              </button>
            </div>

            {/* Bundle Plan */}
            <div className="glass-card p-6 hover:shadow-xl transition-shadow border-2 border-purple-500">
              <div className="absolute -top-3 right-4">
                <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm">
                  Best Value
                </span>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Interview Bundle</h3>
                <div className="text-3xl font-bold text-purple-600 mb-2">₹100</div>
                <p className="text-gray-600">For serious preparation</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  5 Full Interview Sessions
                </li>
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Detailed Feedback
                </li>
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Performance Reports
                </li>
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  33% Savings
                </li>
              </ul>
              <button
                onClick={() => handlePayment('price_bundle')}
                className="w-full btn btn-primary"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PricingModal; 