import express from 'express';

// model import
import Project from '../../models/Projects.js';

const router = express.Router();


router.get('/',async (req, res)=>{
    try{
        const projects = await Project.find({client: req.user._id}).populate('assignedTeammates').lean();
        const client = req.user
        res.render('client_dash/client_dash', {projects, client})
    }catch(err){
        console.log(err);
        return res.status(500).send('Internal Server Error')
    }
})

// Pirooojeecttt VIEWWWWWWWWW
router.get('/pv/:projectId',async (req, res)=>{
    const projectId = req.params.projectId;
    try{
        const project = await Project.findOne({_id: projectId})
        if(!project){
            req.flash('error', 'Project not found.')
            return res.redirect('/client')
        }
        if(!project.client.equals(req.user._id)){
            req.flash('error', 'Unauthorized')
            return res.redirect('/client')
        }

        res.render('client_dash/clientProject', project)
    }catch(err){
        console.log(err);
        res.status(500).send('Internal Server Error')
    }
})


router.get('/add', (req, res)=>{
    res.render('clientele/addClient')
})

router.post('/add', (req, res)=>{
    console.log(req.body)
})


export default router;