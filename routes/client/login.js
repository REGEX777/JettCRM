import express from 'express';
import { isLoggedOut } from '../../middleware/isLoggedOut.js';


const router = express.Router();


router.get('/',isLoggedOut, (req, res)=>{
    res.render('login')
})


export default router;