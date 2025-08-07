import express from 'express';

// model import
import Estimate from '../../models/Estimate.js';



const router = express.Router();

router.get('/v/:id', async (req, res)=>{
    try{
        const estimateId = req.params.id;

        if(!estimateId){
            req.flash('error','Invalid Request')
            res.redirect('/tools/estimates')
        }

        const estimate = await Estimate.findOne({_id: estimateId}).populate('user');
        if(!req.user._id.equals(estimate.user._id)){
            req.flash('error', 'Unauthorized')
            return res.redirect('/tools/estimate')
        }

        const headerText = "eee"

        res.render('estimate/estimateView', {estimate, headerText})
        
    }catch(err){
        console.log(err);
        res.status(500).send('Internal Server Error')
    }
})


router.get('/', async (req, res)=>{
    try{
        const estimates = await Estimate.find({user: req.user._id});
        const headerText = "EEEOOOO"
        res.render("estimate/estimates", {estimates, headerText})

    }catch(err){
        console.log(err)
        res.status(500).send('Internal Server Error')
    }
})


router.get('/create', (req, res)=>{
    try{
        const headerText = "Estimate Maker"
        const backBtnLink = "/"
        res.render('estimate/createEstimate', {headerText, backBtnLink})
    }catch(err){
        console.log(err);
        res.status(500).send('Internal Server Error')
    }
})

router.post('/create',async (req, res)=>{
    const { items, tax, discount, discountType, notes } = req.body;
    try {

        const parsedItems = items.map(item => ({
            name: item.name,
            price: Number(item.price)
        }));

        const originalTotal = parsedItems.reduce((acc, item) => acc + item.price, 0);

        let discountValue = 0;

        if (discountType === 'flat') {
            discountValue = Number(discount);
        } else if (discountType === 'percent') {
            discountValue = (originalTotal * Number(discount)) / 100;
        }

        const totalAfterDiscount = originalTotal - discountValue;
        
        const newEstimate = new Estimate({
            items: items.map(item => ({
                name: item.name,
                price: Number(item.price)
            })),
            tax: Number(tax),
            discount: Number(discount),
            discountType,
            notes,
            user: req.user._id,
        
            originalTotal,
            totalAfterDiscount
        })

        newEstimate.save();
        req.flash('success', 'Estimate Created Succesfully')
        res.redirect('/tools/estimate')
    } catch (error) {
        console.log(error)
        res.status(500).send('Internal Server Error')
    }
})

export default router;