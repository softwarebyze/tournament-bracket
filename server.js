import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Define plans constant
const PLANS = {
  basic: {
    priceId: 'price_1QHhWpGDzOU1ivavIUPI4N1w',
    productId: 'prod_RA1Z1QvWFr76vG'
  },
  premium: {
    priceId: 'price_1QHhXCGDzOU1ivavzZ9U9Lt0',
    productId: 'prod_RA1aw9LXwuSNsn'
  }
};

app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ['POST', 'GET'],
  credentials: true
}));
app.use(express.json());

// Add webhook endpoint to handle successful payments
app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // Handle successful payment
    console.log('Payment successful:', session);
  }

  res.json({received: true});
});

// Update create-checkout-session endpoint
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { priceId } = req.body;
    console.log('Creating checkout for price:', priceId);
    
    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/app?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/app?success=false`,
      metadata: {
        priceId,
      }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a test endpoint to verify the server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
