import express from 'express';
import passport from 'passport';
import cookieParser from 'cookie-parser';

const router = express.Router();

// Middleware Import
import { validateEmail } from '../../middleware/emailValidator.js';

router.post('/', validateEmail, passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
}), (req, res)=>{
    if(req.cookies.redUrl){
        res.redirect(req.cookies.redUrl)
        return
    }
    res.redirect('/')
})

export default router;