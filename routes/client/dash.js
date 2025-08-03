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

    // deadlines coide
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

    if (!user.googleAccessToken || !user.googleRefreshToken) {
      req.flash('error', 'Google Calendar not connected.');
      return res.render('dash', {
        headerText,
        events: [],
        upcomingDeadlines,
        pending,
        completed,
        validation,
        progress
      });
    }

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime'
    });

    let events = response.data.items || [];
    events = events.filter(event =>
      event.hangoutLink ||
      (event.conferenceData?.entryPoints?.[0]?.uri)
    );

    events.sort((a, b) => new Date(a.start.dateTime) - new Date(b.start.dateTime));

    // never gonna  give you up
    res.render('dash', {
      headerText,
      events,
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