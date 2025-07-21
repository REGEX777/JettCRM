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
    const inviteInfo = req.cookies.inviteInfo;

    if(inviteInfo && inviteInfo.token && inviteInfo.role){
        res.clearCookie('inviteInfo')
        return res.redirect(`/invite/accept/${inviteInfo.token}`)
    }
    
    
    if (req.cookies.redUrl) {
        const redUrl = req.cookies.redUrl;
        res.clearCookie('redUrl');
        return res.redirect(redUrl);
    }

    if (req.cookies.inviteInfo) {
        try {
            res.clearCookie('inviteInfo');
            return res.redirect(`/invite/accept/${req.cookies.inviteInfo.token}`)
        } catch (e) {
            console.error('Failed to parse inviteInfo cookie:', e);
        }
    }
    
    req.flash('success', 'Logged in Succesfully.')
    res.redirect('/')
});


export default router;