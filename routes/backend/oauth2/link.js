import express from 'express';
import User from '../../../models/User.js';
import { google } from 'googleapis';

import { oauth2Client, SCOPES } from '../../../controllers/googleAuth.js';

const router = express.Router();

router.get('/auth', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.googleId) {
      req.flash('error', 'Google account already connected. Visit settings to change.');
      return res.redirect('/calendar');
    }

    const state = JSON.stringify({
      userId: req.user._id.toString(),  
      id: req.query.id || '',
      pid: req.query.pid || ''
    });

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      
      scope: SCOPES,
      state: encodeURIComponent(state)  
    });

    console.log(authUrl)
    
    res.redirect(authUrl);
  } catch (err) {
    console.error('Auth error:', err);
    req.flash('error', 'Failed to initiate Google connection');
    res.redirect('/calendar');
  }
});



router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) {
      req.flash('error', 'Something went wrong!');
      console.log('no code provided by google man')
      return res.redirect('/calendar');
    }

    let tokens;
    try {
      const { tokens: receivedTokens } = await oauth2Client.getToken(code);
      tokens = receivedTokens;
      oauth2Client.setCredentials(tokens);
    } catch (tokenError) {
      console.log('Token exchange error:', tokenError);
      req.flash('error', 'Google authentication errors');
      return res.redirect('/link/auth');
    }

    // check access token
    if (!tokens.access_token) {
      req.flash('error', 'No Access TOken found');
      return res.redirect('/link/auth');
    }

    
    let googleUser;
    try {
      const oauth2 = google.oauth2({
        auth: oauth2Client,
        version: 'v2'
      });
      const { data } = await oauth2.userinfo.get();
      googleUser = data;
    } catch (userInfoError) {
      console.log('User info error:', userInfoError);
      
      


      googleUser = { id: 'unknown' };
    }

    
    let id = '', pid = '';
    try {
      if (state) {
        const parsedState = JSON.parse(decodeURIComponent(state));
        id = parsedState.id || '';
        pid = parsedState.pid || '';
      }
    } catch (stateError) {
      console.log('State error:', stateError);
    } 


    // database refreshtoken save
    try {

      const alreadyConnected = await User.findOne({googleId: googleUser.id});
      if(alreadyConnected){
        req.flash('error', 'The account youre trying to connect is already connected to another account')
        return res.redirect('/settings')
      }

      await User.findByIdAndUpdate(req.user._id, {
        googleId: googleUser.id,
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        googleTokenExpiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        ...(googleUser.picture ? { profilePicture: googleUser.picture } : {}),
        verified: true
      });
    } catch (dbError) {
      console.log('Database error:', dbError);
      req.flash('error', 'Failed to save Google connection');
      return res.redirect('/calendar');
    }

    req.flash('success', 'Google account connected successfully!');
    return res.redirect(pid ? `/calendar/new-meeting/${id}/${pid}` : '/calendar');

  } catch (err) {
    console.log('Callback error:', err);
    req.flash('error', 'Failed to complete Google authentication');
    res.redirect('/calendar');
  }
});


export default router;