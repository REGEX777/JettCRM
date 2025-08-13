import express from 'express';

const router = express.Router();

import financeEntry from '../'

router.get('/', (req, res) => {
    res.render('finance/dashboard')
})


router.post('/', async (req, res) => {
    try {
        const data = req.body;
        // const newEntry = new financeEntry({
        //     title: data.title,
        //     amount: data.amount,
        //     date: data.date,
        //     client: data.clientEmail,
        //     user: req.user
        // })
        // fix this later
        await newEntry.save();
        req.flash('success', 'Entry Saved Succesfully!')
        res.redirect('/revenue')
    } catch (err) {
        console.log(err)
        res.status(500).send('Internal Server Error')
    }

})

export default router;