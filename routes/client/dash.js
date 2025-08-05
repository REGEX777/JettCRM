import express from 'express';
import { oauth2Client, SCOPES } from '../../controllers/googleAuth.js';
import { google } from 'googleapis';

// middleware import


// modal import
import Project from '../../models/Projects.js';
import Team from '../../models/Team.js';

const router = express.Router()


router.get('/', async (req, res) => {
  try {
    const user = req.user;
    const headerText = `Welcome, ${user.firstName}`;

    const teamsOwned = await Team.find({ owner: user._id }).lean();
    const projectIds = teamsOwned.flatMap(team => team.projects);

    let pending = 0;
    let completed = 0;
    let validation = 0;

    if (projectIds.length) {
      const projectsWithTasks = await Project.find({ _id: { $in: projectIds } }, { tasks: 1 }).lean();
      projectsWithTasks.forEach(project => {
        project.tasks.forEach(task => {
          if (task.status === 'working') pending++;
          else if (task.status === 'completed') completed++;
          else if (task.status === 'pending approval') validation++;
        });
      });
    }

    const total = pending + completed + validation;
    const progress = total > 0 ? Math.round(((completed + validation) / total) * 100) : 0;

    // deadlines code
    let upcomingDeadlines = [];
    if (projectIds.length) {
      const projects = await Project.find({
        _id: { $in: projectIds },
        deadlineDate: { $ne: null }
      }).sort({ deadlineDate: 1 }).limit(2).lean();

      const today = new Date();
      upcomingDeadlines = projects.map(project => ({
        name: project.name,
        daysRemaining: Math.ceil((new Date(project.deadlineDate) - today) / (1000 * 60 * 60 * 24)),
        _id: project._id
      }));
    }

    res.render('dash', {
      headerText,
      events: [],
      upcomingDeadlines,
      pending,
      completed,
      validation,
      progress
    });

  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});


export default router;