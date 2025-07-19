import express from 'express';
const router = express.Router();

// model import
import Project from '../../models/Projects.js';

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

    console.log(userTasks)

    res.render('taskmanager/tasks', {
      project,
      tasks: userTasks
    });
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});
export default router;
