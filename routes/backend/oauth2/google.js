import express from 'express';
import passport from 'passport';



const router = express.Router();



router.get('/google', (req, res, next) => {
  const { token, role } = req.query;
  if (token && role) {
    req.session.oauthInvite = { token, role };
  }
  passport.authenticate('google', { scope: ['profile', 'email', 'https://www.googleapis.com/auth/meetings.space.created' ,'https://www.googleapis.com/auth/calendar', 'openid'], accessType: "offline", prompt: "consent" })(req, res, next);
});


router.get('/google/connect', (req, res, next) => {
  req.session.oauthConnect = true;
  req.session.connectRedirect = req.query.redirect || req.get('Referrer') || '/settings';

  passport.authenticate('google', {
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/meetings.space.created'
    ],
    accessType: 'offline',
    prompt: 'consent'
  })(req, res, next);
})

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    failureFlash: true
  }),
  (req, res) => {
    const wasConnect = !!req.session.oauthConnect;
    const connectRedirect = req.session.connectRedirect;

    const redirectTo = wasConnect ? (connectRedirect || '/settings') : (req.session.redUrl || '/');

    delete req.session.oauthConnect;
    delete req.session.connectRedirect;
    delete req.session.redUrl;


    if (wasConnect) {
      req.flash('success', 'Google account connected successfully.');
    } else {
      req.flash('success', 'Logged in successfully.');
    }
    res.redirect(redirectTo);
  }
);


export default router;