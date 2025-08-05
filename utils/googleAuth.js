import 'dotenv/config'

import {google} from 'googleapis';


// model import
import User from '../models/User.js';

const oauth2 = google.auth.OAuth2;

const oauth2Client = new oauth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
)


async function refreshGoogleTokenIfNeeded(user) {
    if (!user || !user.google) {
        return null;
    }

    oauth2Client.setCredentials({
        access_token: user.google.access_token,
        refresh_token: user.google.refresh_token,
        expiry_date: user.google.expiry_date,
    });

    // token expired or not
    const isExpired = !user.google.expiry_date || Date.now() >= user.google.expiry_date;

    if (isExpired) {
        const { credentials: tokens } = await oauth2Client.refreshAccessToken();

        const updateData = {
        googleAccessToken: tokens.access_token,
        googleTokenExpiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        };

        // persist the toklens if not expired maybe pls
        if (tokens.refresh_token) {
        updateData.googleRefreshToken = tokens.refresh_token;
        } else if (user.googleRefreshToken) {
        updateData.googleRefreshToken = user.googleRefreshToken;
        }

        await User.findByIdAndUpdate(user._id, updateData);

        oauth2Client.setCredentials(updateData);
    }

    return oauth2Client;
}

export default refreshGoogleTokenIfNeeded;