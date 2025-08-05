import express from 'express';


const router = express.Router();

router.get('/', (req, res)=>{
    try{
        const headerText = "Estimate Maker"
        const backBtnLink = "/"
        res.render('estimate/estimate', {headerText, backBtnLink})
    }catch(err){
        console.log(err);
        res.status(500).send('Internal Server Error')
    }
})

export default router;