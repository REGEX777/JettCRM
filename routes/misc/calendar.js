import express from 'express';
import { oauth2Client, SCOPES } from '../../controllers/googleAuth.js';
import { google } from 'googleapis';
import User from '../../models/User.js';

const router = express.Router();

router.get('/auth', (req, res) => {

  const id = req.query.id || '';
  const clientId = encodeURIComponent(id);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state: clientId,
  });
  res.redirect(authUrl);
});

router.get('/callback', async (req, res) => {
  const code = req.query.code;
  const id = req.query.state;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    await User.findByIdAndUpdate(req.user._id, {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      googleTokenExpiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    });

    req.flash('success', 'Google Calendar connected!');
    return res.redirect(`/calendar/new-meeting/${id}`);
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

    res.render('calendar/all-meetings', { events: meetingEvents });

  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).send('Failed to load meetings.');
  }
});



router.get('/new-meeting/:id', async (req, res) => {
  try {
    const user = req.user;
    const clientId = req.params.id;

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
      user.googleTokenExpiryDate = credentials.expiry_date ? new Date(credentials.expiry_date) : null;
      await user.save();
      console.log('🔁 Token refreshed for', user.email);
    }

    const client = await User.findById(clientId);
    const prefillEmail = client?.email || '';

    res.render('calendar/new-meeting', { user, prefillEmail });
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

    // token refersh
    const tokenInfo = await oauth2Client.getAccessToken();
    if (tokenInfo.res && tokenInfo.res.data.expiry_date < Date.now()) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      user.googleAccessToken = credentials.access_token;
      user.googleTokenExpiryDate = credentials.expiry_date ? new Date(credentials.expiry_date) : null;
      await user.save();
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const { summary, description, startTime, endTime, attendees } = req.body;

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
    req.flash('success', `Meeting created! Meet link: ${meetLink}`);
    res.redirect('/calendar/new-meeting');

  } catch (err) {
    console.error('Error creating Google Meet event:', err);
    req.flash('error', 'Failed to create meeting.');
    res.redirect('/calendar/new-meeting');
  }
});

export default router;
