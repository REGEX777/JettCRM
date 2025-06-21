import express from 'express';
import { isLoggedIn } from '../../middleware/isLoggedin.js';

const router = express.Router();

router.get('/', isLoggedIn, (req, res)=>{
    req.logOut(function(err){
        if(err){
            return next(err);
        }
        res.redirect('/login')
    })
})


export default router;