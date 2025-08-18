import express from 'express';
import { oauth2Client, SCOPES } from '../../controllers/googleAuth.js';
import { google } from 'googleapis';
import mongoose from 'mongoose';

import User from '../../models/User.js';
import Project from '../../models/Projects.js';
import { header } from 'express-validator';

const router = express.Router();






// meeting stuff


router.get('/', async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      req.flash('error', 'Please log in first');
      return res.redirect('/login');
    }


    if (!user.googleRefreshToken) {
      req.flash('error', 'Google Calendar not connected.');
      return res.redirect('/link/auth');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );

    
    oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken
    });

    try {
      const { token } = await oauth2Client.getAccessToken();
      

      req.session.googleAccessToken = token;
      
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const eventsResponse = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime'
      });

      const meetingEvents = eventsResponse.data.items.filter(event =>
        event.conferenceData &&
        event.conferenceData.entryPoints &&
        event.conferenceData.entryPoints.some(point => point.entryPointType === 'video')
      );
      
      meetingEvents.sort((a, b) => {
        const aTime = new Date(a.start.dateTime || a.start.date).getTime();
        const bTime = new Date(b.start.dateTime || b.start.date).getTime();
        return bTime - aTime;
      });

      const headerText = "All Meetings";
      const backBtnLink = '/dashboard';

      return res.render('calendar/all-meetings', { 
        events: meetingEvents, 
        headerText, 
        backBtnLink 
      });

    } catch (err) {
      console.log('API error:', err);
      if (err.code === 401) {
        
        req.flash('error', 'Your Google session expired. Please reconnect.');
        return res.redirect('/link/auth');
      }
      throw err;
    }

  } catch (err) {
    console.log('Error fetching events:', err);
    req.flash('error', 'Failed to load meetings.');
    return res.redirect('/dashboard');
  }
});



router.get('/new-meeting', async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).send('Unauthorized');

    if(!user.googleRefreshToken){
      req.flash('error', 'Google account not connected')
      return res.redirect('/link/auth');
    }

    const isExpired =
      user.googleTokenExpiryDate &&
      new Date(user.googleTokenExpiryDate).getTime() < Date.now();

    if (isExpired) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      user.googleAccessToken = credentials.access_token;
      user.googleTokenExpiryDate = credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : null;
      await user.save();
    }

    const clientId = req.query.id;
    const projectId = req.query.pid;

    let prefillEmail = '';
    if (clientId && mongoose.Types.ObjectId.isValid(clientId)){
      const client = await User.findById(clientId);
      prefillEmail = client?.email || '';
    }

    const headerText = "Schedule A New Meeting"
    const backBtnLink = '/calendar'
    res.render('calendar/new-meeting', {
      user,
      prefillEmail,
      projectId: projectId || '',
      headerText,
      backBtnLink
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/create', async (req, res) => {
  try {
    const { user, body } = req;

    
    if (!user) {
      req.flash('error', 'Please log in first');
      return res.redirect('/login');
    }
    
    if (!user.googleRefreshToken) {
      req.flash('error', 'Google Calendar not connected');
      return res.redirect('/link/auth');
    }

    

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );
    oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken
    });



    try {
      await oauth2Client.getAccessToken();
    } catch (err) {
      console.log('Token error:', err);
      req.flash('error', 'Session expired. Please reconnect Google.');
      return res.redirect('/link/auth');
    }

    // Prepare meeting event
    const { summary, description, startTime, endTime, attendees, projectId } = body;
    
    const event = {
      summary: summary || 'Meeting',
      description: description || '',
      start: {
        dateTime: new Date(startTime).toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: new Date(endTime).toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      },
      attendees: attendees ? 
        attendees.split(',')
          .map(email => email.trim())
          .filter(email => email.length > 0)
          .map(email => ({ email })) : 
        []
    };

    // calender update
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all'
    });

    const meetLink = response.data.hangoutLink;

    // pprojec update incase of client
    if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
      try {
        const project = await Project.findById(projectId).populate('client');
        if (project?.client?.email) {
          const isClientInvited = event.attendees.some(
            a => a.email.toLowerCase() === project.client.email.toLowerCase()
          );

          if (isClientInvited) {
            await Project.findByIdAndUpdate(projectId, {
              $set: { latestMeetingLink: meetLink },
              $push: {
                updates: {
                  title: 'Meeting Scheduled',
                  uType: 'alert',
                  icon: 'calendar',
                  details: 'A new meeting has been scheduled by the Project Manager.',
                  relatedLinks: [{
                    linkTitle: 'Join Meeting',
                    link: meetLink
                  }],
                  createdAt: new Date()
                }
              }
            });
          }
        }
      } catch (projectErr) {
        console.log(projectErr);
      }
    }

    req.flash('success', 'Meeting created successfully!');
    return res.redirect('/calendar');

  } catch (err) {
    console.log(err);
    
    let errorMessage = 'Failed to create meeting';
    if (err.code === 401) {
      errorMessage = 'Google session expired. Please reconnect.';
    } else if (err.message.includes('end date')) {
      errorMessage = 'End time must be after start time';
    }

    req.flash('error', errorMessage);
    return res.redirect('/calendar/new-meeting');
  }
});

export default router;
