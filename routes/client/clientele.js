import express from 'express';

const router = express.Router();


router.get('/', (req, res)=>{
    res.send('helo')
})

router.get('/add', (req, res)=>{
    res.render('clientele/addClient')
})

router.post('/add', (req, res)=>{
    console.log(req.body)
})


export default router;