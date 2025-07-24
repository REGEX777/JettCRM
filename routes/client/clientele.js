import express from 'express';

// model import
import Project from '../../models/Projects.js';

const router = express.Router();


router.get('/', async (req, res) => {
  const { status, sort } = req.query;

  try {
    let query = { client: req.user._id };

    if (status) {
      query.status = status;
    }

    let projectsQuery = Project.find(query).populate('assignedTeammates');

    if (sort === 'asc') {
      projectsQuery = projectsQuery.sort({ createdAt: 1 });
    } else {
      projectsQuery = projectsQuery.sort({ createdAt: -1 });
    }

    const projects = await projectsQuery.lean();
    const client = req.user;

    res.render('client_dash/client_dash', {
      projects,
      client,
      filters: {
        status: status || '',
        sort: sort || 'desc'
      }
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send('Internal Server Error');
  }
});
// Pirooojeecttt VIEWWWWWWWWW
router.get('/pv/:projectId',async (req, res)=>{
    const projectId = req.params.projectId;
    try{
        const project = await Project.findOne({_id: projectId}).populate({
            path: 'team',
            populate:{
                path: 'owner'
            }
        })
        if(!project){
            req.flash('error', 'Project not found.')
            return res.redirect('/client')
        }
        if(!project.client.equals(req.user._id)){
            req.flash('error', 'Unauthorized')
            return res.redirect('/client')
        }
        res.render('client_dash/clientProject', {project})
    }catch(err){
        console.log(err);
        res.status(500).send('Internal Server Error')
    }
})

router.get('/api/projects', async (req, res) => {
  const search = req.query.search || '';
  const regex = new RegExp(search, 'i');

  try {
    const projects = await Project.find({
      client: req.user._id,
      name: { $regex: regex }
    }).populate('assignedTeammates').lean();

    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/add', (req, res)=>{
    res.render('clientele/addClient')
})

router.post('/add', (req, res)=>{
    console.log(req.body)
})


export default router;