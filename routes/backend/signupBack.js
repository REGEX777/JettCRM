import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';

// Middleware Import
import { validateEmail } from '../../middleware/emailValidator.js';
import { isLoggedOut } from '../../middleware/isLoggedOut.js';

// model import
import User from '../../models/User.js';

const router = express.Router();


router.post('/', validateEmail, isLoggedOut, async (req, res)=>{
    const existingUser = await User.findOne({
        email: req.body.email
    });
    
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const errorMessages = errors.array().map(error => error.msg)
        req.flash('error', errorMessages)
        return res.redirect('/signup')
    }

    if(existingUser){
        req.flash('error', 'The email you entered is already in use.')
        return res.redirect('/signup')
    }

    const hash = await bcrypt.hash(req.body.password, 12);
    
    const newUser = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: hash,
        admin: false,
        accountCreation: Date.now()
    })

    await newUser.save();

    req.login(newUser, (err)=>{
        req.flash('success', 'Congratulations! You have signed up succesfully, please check your mails to verify your account.')

        if(err) return res.status(500).send(err);
        return res.redirect('/')
    })
})


export default router;