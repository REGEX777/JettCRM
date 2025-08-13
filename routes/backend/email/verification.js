import express from 'express';


const router = express.Router();

// model import
import User from '../../../models/User.js';


router.get('/:token',async (req, res)=>{
    try{
        const token = req.params.token;
        
        const user = await User.findOne({verificationToken: token});

        if(!user){
            return res.send('Invalid Request')
        }

        user.verified = true;
        await user.save();


        req.flash('success', 'Email Verified Successfully')
        res.redirect('/')

    }catch(err){
        console.log(err)
        res.status(500).send('Internal Server Error')
    }
})

export default router;