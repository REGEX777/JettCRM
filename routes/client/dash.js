import express from 'express';

// middleware import

import { isLoggedIn } from '../../middleware/isLoggedin.js';

const router = express.Router()


router.get('/', isLoggedIn, (req, res)=>{
    res.render('dash')
})

export default router;