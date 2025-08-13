import express from 'express';


// import model
import User from '../../models/User.js';

const router = express.Router();



router.get('/', async (req, res)=>{
    try{
        
        const user = await User.findById(req.user._id).select('teamOwnerOf teamMemberOf clientOf').lean();

        const isTeamOwner = Array.isArray(user.teamOwnerOf) && user.teamOwnerOf.length > 0;

        const isFreelancer = Array.isArray(user.teamMemberOf) && user.teamMemberOf.length > 0;

        const isClient = Array.isArray(user.clientOf) && user.clientOf.length > 0;

        res.render('extra/dashboardSelector', {
            headerText: 'eee',
            isTeamOwner,
            isFreelancer,
            isClient
        });
    }catch(err){
        console.log(err)
        res.status(500).send('Internal Server Error')
    }
})

export default router;