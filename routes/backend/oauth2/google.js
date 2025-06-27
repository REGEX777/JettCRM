import express from 'express';
import passport from 'passport';



const router = express.Router();



router.get('/google', passport.authenticate('google', {scope: ['profile', 'email']}));

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    failureFlash: true
  }),
  (req, res) => {
    const redirectTo = req.session.redUrl || '/';
    delete req.session.redUrl;

    req.flash('success', 'Logged in successfully.');
    res.redirect(redirectTo);
  }
);


export default router;