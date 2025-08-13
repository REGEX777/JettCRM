import express from 'express';
const router = express.Router();

// model import
import Project from '../../models/Projects.js';
import { header } from 'express-validator';

router.get('/:id/tasks', async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user._id;

    const project = await Project.findOne({ _id: projectId }).lean();

    if (!project) {
      req.flash('error', 'Project Not Found');
      return res.redirect('/myteam');
    }
 
    const userTasks = project.tasks.filter(task =>
      task.teammates.some(teammate => teammate.toString() === userId.toString())
    );
    
    const headerText = "Project View"
    const backBtnLink = `/myteam/${project.team}`
    res.render('taskmanager/tasks', {
      project,
      tasks: userTasks,
      headerText,
      backBtnLink
    });
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/complete/:projectId/:taskId',async (req, res)=>{
  const projectId = req.params.projectId;
  const taskId = req.params.taskId
  try{
    const project = await Project.findOne({_id: projectId})
    if(!project){
      req.flash('error', 'Project Was Not Found')
      return res.redirect('/myteam')
    }

    const task = project.tasks.id(taskId);
    if(!task){
      req.flash('error', 'Task was not found')
      return res.redirect('/myteam')
    }
    const isTeammate = task.teammates.some(teammateId => teammateId.toString() === req.user._id.toString());

    if (!isTeammate) {
      req.flash('error', 'You are not assigned to this task');
      return res.redirect('/myteam');
    }

    task.approvalLink = req.body.completionLink;
    task.status = 'pending approval'
    await project.save();

    req.flash('success', 'Successfully Submitted!')
    res.redirect(`/mytasks/${projectId}/tasks`)
  }catch(err){
    console.log(err);
    return res.status(500).send('Internal Server Error')
  }
})

router.get('/approve/:projectId/:taskId', async(req, res)=>{
  const projectId = req.params.projectId;
  const taskId = req.params.taskId;
  try{
    const project = await Project.findOne({_id: projectId}).populate('team')
    if(!project){
      req.flash('error', "Project Not Found")
      return res.redirect('/projects')
    }

    if(!project.team.owner.equals(req.user._id)){
      req.flash('error', 'Unauthorized!')
      return res.redirect('/projects')
    }

    const task = project.tasks.id(taskId);
    if(!task){
      req.flash('error', 'Task Not Found')
      return res.redirect(`/projects/v/${projectId}`)
    }
    task.status = 'completed';
    await project.save();

    req.flash('success', 'Task Apporved Succesfully')
    res.redirect(`/projects/v/${projectId}`)
  }catch(err){
    console.log(err)
    return res.status(500).send('Internal Server Error')
  }
})
export default router;
