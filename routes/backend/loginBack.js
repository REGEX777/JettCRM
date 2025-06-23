import express from 'express';
import passport from 'passport';
import cookieParser from 'cookie-parser';

const router = express.Router();

// Middleware Import
import { validateEmail } from '../../middleware/emailValidator.js';

router.post('/', validateEmail, passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
}), (req, res) => {
    const redirectTo = req.session.redUrl || '/';
    console.log('[login] Redirecting to:', redirectTo);
    delete req.session.redUrl;
    res.redirect(redirectTo);
});

export default router;