import express from 'express';
import Stripe from 'stripe';

import User from '../../models/User.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_KEY, {
  apiVersion: '2025-06-30.basil'
});

// GET /connect/onboard
router.get('/onboard', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).send('Please log in to continue.');
    }

    let connectedAccountId = req.user.stripeAccountId;

    if (!connectedAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: req.user.email,
        metadata: {
          platformUserId: req.user._id.toString(),
        },
      });

      connectedAccountId = account.id;

      await User.findByIdAndUpdate(req.user._id, {
        stripeAccountId: connectedAccountId,
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: connectedAccountId,
      refresh_url: `http://localhost:9000/stripe/connect/onboard/refresh`,
      return_url: `http://localhost:9000/stripe/connect/status`,
      type: 'account_onboarding',
    });

    return res.redirect(accountLink.url);
  } catch (err) {
    console.error('Stripe Onboarding Error:', err);
    return res.status(500).send('Something went wrong with onboarding. Try again.');
  }
});


router.get('/connect/onboard/refresh',  async (req, res) => {
  try {
    const connectedAccountId = req.user.stripeAccountId;

    if (!connectedAccountId) {
      return res.status(400).send('You do not have a Stripe account connected.');
    }

    const accountLink = await stripe.accountLinks.create({
      account: connectedAccountId,
      refresh_url: 'http://localhost:9000/stripe/connect/onboard/refresh',
      return_url: 'http://localhost:9000/stripe/connect/status',
      type: 'account_onboarding'
    });
 
    res.redirect(accountLink.url);
  } catch (err) {
    console.error('Stripe Onboarding Refresh Error:', err);
    res.status(500).send('Failed to refresh onboarding.');
  }
});

router.get('/connect/status',  async (req, res) => {
  try {
    const connectedAccountId = req.user.stripeAccountId;

    if (!connectedAccountId) {
      return res.status(400).send('You do not have a Stripe account connected.');
    }

    const account = await stripe.accounts.retrieve(connectedAccountId);
 
    if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
      return res.send(`
        <h2>✅ Onboarding complete!</h2>
        <p>You can now receive payments.</p>
        <a href="/">Back to dashboard</a>
      `);
    } else {
      return res.send(`
        <h2>⚠️ Onboarding not complete.</h2>
        <p>Please finish the onboarding process.</p>
        <a href="/connect/onboard/refresh">Try Again</a>
      `);
    }
  } catch (err) {
    console.error('Stripe Status Check Error:', err);
    res.status(500).send('Could not check account status.');
  }
});

export default router;
