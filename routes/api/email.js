import express from 'express';
import EmailUpdate from '../../models/EmailUpdate.js';
import User from '../../models/User.js';


const router = express.Router();


router.get('/verify/:token', async (req, res)=>{
    const token = req.params.token;

    try {
        const record = await EmailUpdate.findOne({token});
        if (!record || record.expiresAt < new Date()) {
            return res.status(400).send('Invalid or expired token');
        }

        await User.findByIdAndUpdate(record.userId, {
            email: record.newEmail,
            lastEmailChange: new Date()
        })

        await EmailUpdate.deleteOne({ _id: record._id });


        req.flash('success', "Email Updates Succesuflly")
        res.redirect('/settings')
    } catch (error) {
        console.log(err)
        res.status(500).send('Internal Server Error')
    }
})


export default router;