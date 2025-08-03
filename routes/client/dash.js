import express from 'express';

// middleware import


const router = express.Router()


router.get('/',  (req, res)=>{
    try{
        const user = req.user;
        const headerText = `Welcome, ${user.firstName}`;
        res.render('dash', {headerText})
    }catch(err){
        console.log(err)
        res.status(500).send("Internal Server Error")
    }
    res.render('dash')
})

export default router;