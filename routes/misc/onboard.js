import express from 'express';
import stripePackage from 'stripe';
import User from '../../models/User.js';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();
const stripe = stripePackage(process.env.STRIPE_KEY);

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
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        metadata: {
          platformUserId: req.user._id.toString()
        }
      });

      connectedAccountId = account.id;

      await User.findByIdAndUpdate(req.user._id, {
        stripeAccountId: connectedAccountId
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: connectedAccountId,
      refresh_url: 'https://jettcrm.thesmartscribe.com/stripe/connect/onboard/refresh',
      return_url: 'https://jettcrm.thesmartscribe.com/stripe/connect/status',
      type: 'account_onboarding'
    });

    return res.redirect(accountLink.url);
  } catch (err) {
    console.error('Stripe Onboarding Error:', err);
    return res.status(500).send('Something went wrong during Stripe onboarding.');
  }
});

export default router;
