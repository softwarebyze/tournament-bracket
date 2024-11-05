import React, { useState } from 'react';
import { Crown, Check, Loader } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.STRIPE_PUBLIC_KEY || 'your_stripe_public_key');

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProModal({ isOpen, onClose }: ProModalProps) {
  const [loading, setLoading] = useState(false);
  const setProStatus = useUserStore(state => state.setProStatus);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
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
          priceId: 'price_H5ggYwtDq5YPwb', // Your Stripe price ID
        }),
      });

      const session = await response.json();

      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('Payment failed:', error);
      // For demo purposes, we'll just set pro status
      setProStatus(true);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const features = [
    'Unlimited tournaments',
    'Custom tournament themes',
    'Export brackets as PDF',
    'Priority support',
    'Ad-free experience',
    'Tournament statistics & analytics',
    'Custom branding options',
    'API access for integration',
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full mx-auto overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 text-white text-center">
          <Crown className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">Upgrade to Pro</h2>
          <p className="text-indigo-100">Take your tournaments to the next level</p>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <div className="text-center mb-6">
              <div className="text-4xl font-bold">$9.99<span className="text-lg text-gray-500">/month</span></div>
              <p className="text-gray-500">Cancel anytime · 14-day money-back guarantee</p>
            </div>

            <ul className="space-y-4">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Upgrade Now'
            )}
          </button>
          
          <button
            onClick={onClose}
            className="w-full text-gray-500 py-2 mt-4 hover:text-gray-700 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}