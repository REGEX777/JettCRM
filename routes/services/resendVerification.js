import express from 'express';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_KEY)


const router = express.Router();

// model import
import User from '../../models/User.js';

router.get('/', async (req, res)=>{
    try {
        const user = req.user;
        if(!user){
            res.redirect('/login')
        }

        if(user.verified){
            res.redirect('/dashboard')
        }

        const thirty_minutes = 30 * 60 * 1000;

        if(!user.lastVerificationEmail){
            user.lastVerificationEmail = Date.now()
            await user.save()

            const { data, error } = await resend.emails.send({
                from: 'verify@thesmartscribe.com',
                to: [user.email],
                subject: 'Verify your JettCRM account',
                html: `<a href="https://jettcrm.thesmartscribe.com/verify/${user.verificationToken}">Verify Account</a>`
            });


            if (error) {
                console.error('Resend email error:', error);
            } else {
                console.log('Email sent successfully:', data);
            }



        }else{
            const now = Date.now();
            const lastSent = new Date(user.lastVerificationEmail).getTime();

            if(now-lastSent>=thirty_minutes){
                user.lastVerificationEmail = Date.now()
                await user.save()

                const { data, error } = await resend.emails.send({
                    from: 'verify@thesmartscribe.com',
                    to: [user.email],
                    subject: 'Verify your JettCRM account',
                    html: `<a href="https://jettcrm.thesmartscribe.com/verify/${user.verificationToken}">Verify Account</a>`
                });


                if (error) {
                    console.error('Resend email error:', error);
                } else {
                    console.log('Email sent successfully:', data);
                }

                req.flash('success', 'Email sent successfully')
                res.redirect('/dashboard')
            }else{
                req.flash('error', 'Please wait for some time before trying again')
                res.redirect('/dashboard')
            }
        }
    } catch (error) {
        console.log(error)
        res.status.send('Internal Server Error')
    }
})

export default router;