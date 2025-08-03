import express from 'express';
import { oauth2Client, SCOPES } from '../../controllers/googleAuth.js';
import { google } from 'googleapis';
import mongoose from 'mongoose';

import User from '../../models/User.js';
import Project from '../../models/Projects.js';
import { header } from 'express-validator';

const router = express.Router();

router.get('/auth', (req, res) => {

  const id = req.query.id || '';
  const pid = req.query.pid || '';
  const stateObj = { id, pid };
  const encodedState = encodeURIComponent(JSON.stringify(stateObj));
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state: encodedState,
  });
  res.redirect(authUrl);
});

router.get('/callback', async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;

  let id = '', pid = '';

  try {
    if (state) {
      const parsed = JSON.parse(decodeURIComponent(state));
      id = parsed.id;
      pid = parsed.pid;
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    await User.findByIdAndUpdate(req.user._id, {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      googleTokenExpiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    });

    req.flash('success', 'Google Calendar connected!');
    return res.redirect(`/calendar/new-meeting/${id}/${pid}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).send('Failed to authenticate with Google');
  }
});


// meeting stuff


router.get('/', async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.googleAccessToken || !user.googleRefreshToken) {
      req.flash('error', 'Google Calendar not connected.');
      return res.redirect('/calendar/auth');
    }

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken
    });

    const tokenInfo = await oauth2Client.getAccessToken();
    if (tokenInfo.res && tokenInfo.res.data.expiry_date < Date.now()) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      user.googleAccessToken = credentials.access_token;
      user.googleTokenExpiryDate = credentials.expiry_date ? new Date(credentials.expiry_date) : null;
      await user.save();
    }

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

    const headerText = "All Meetings"
    const backBtnLink = '/'
    res.render('calendar/all-meetings', { events: meetingEvents, headerText, backBtnLink });

  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).send('Failed to load meetings.');
  }
});



router.get('/new-meeting', async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).send('Unauthorized');

    const hasGoogleAuth = user.googleAccessToken && user.googleRefreshToken;
    if (!hasGoogleAuth) return res.redirect('/calendar/auth');

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
      expiry_date: user.googleTokenExpiryDate?.getTime(),
    });

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
      console.log('🔁 Token refreshed for', user.email);
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
    const user = req.user;

    if (!user || !user.googleAccessToken || !user.googleRefreshToken) {
      req.flash('error', 'Google Calendar not connected');
      return res.redirect('/calendar/new-meeting');
    }

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken
    });

    if (user.googleTokenExpiryDate && user.googleTokenExpiryDate < new Date()) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      user.googleAccessToken = credentials.access_token;
      user.googleTokenExpiryDate = credentials.expiry_date ? new Date(credentials.expiry_date) : null;
      await user.save();
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const { summary, description, startTime, endTime, attendees, projectId } = req.body;

    const event = {
      summary,
      description,
      start: {
        dateTime: new Date(startTime),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: new Date(endTime),
        timeZone: 'Asia/Kolkata',
      },
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      attendees: attendees
        ? attendees.split(',').map(email => ({ email: email.trim() }))
        : [],
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
    });

    const meetLink = response.data?.hangoutLink || 'No Meet link generated';

    const project = await Project.findOne({ _id: projectId }).populate('client');

    if (project && project.client && project.client.email) {
      const isClientInvited = event.attendees.some(
        a => a.email.toLowerCase() === project.client.email.toLowerCase()
      );

      if (isClientInvited) {
        project.latestMeetingLink = meetLink;

        project.updates.push({
          title: 'Meeting Created',
          uType: 'alert',
          icon: 'calendar',
          details: `A new meeting has been scheduled by the Project Manager.`,
          relatedLinks: [
            {
              linkTitle: 'Join Meeting',
              link: meetLink
            }
          ],
          status: null
        });

        await project.save();
      }
    }

    req.flash('success', `Meeting created! Meet link: ${meetLink}`);
    res.redirect('/calendar');

  } catch (err) {
    console.error('Error creating Google Meet event:', err);
    req.flash('error', 'Failed to create meeting.');
    res.redirect('/calendar/new-meeting');
  }
});

export default router;
