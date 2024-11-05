import React, { useState } from 'react';
import { Crown, Check, Loader } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 4.99,
    priceId: 'price_basic',
    features: [
      'Up to 8 tournaments',
      'Single elimination brackets',
      'Basic tournament stats',
      'Email support'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    priceId: 'price_premium',
    features: [
      'Unlimited tournaments',
      'All bracket formats',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
      'API access'
    ]
  }
];

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProModal({ isOpen, onClose }: ProModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]);
  const [error, setError] = useState<string | null>(null);
  const setProStatus = useUserStore(state => state.setProStatus);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setError(null);
    try {
      setLoading(true);
      const stripe = await stripePromise;
      
      if (!stripe) throw new Error('Stripe failed to load');

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: selectedPlan.priceId,
          planId: selectedPlan.id
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const session = await response.json();

      const { error } = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (error) throw error;
      
    } catch (error) {
      console.error('Payment failed:', error);
      setError('Payment failed. Please try again.');
      
      // For demo only - remove in production
      if (process.env.NODE_ENV === 'development') {
        setProStatus(true);
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full mx-auto overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 text-white text-center">
          <Crown className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
          <p className="text-indigo-100">Select the perfect plan for your tournaments</p>
        </div>

        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {PLANS.map(plan => (
              <div 
                key={plan.id}
                className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                  selectedPlan.id === plan.id 
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => setSelectedPlan(plan)}
              >
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold mb-4">
                  ${plan.price}<span className="text-lg text-gray-500">/month</span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              `Upgrade to ${selectedPlan.name}`
            )}
          </button>
          
          <button
            onClick={onClose}
            className="w-full text-gray-500 py-3 mt-4 hover:text-gray-700 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}