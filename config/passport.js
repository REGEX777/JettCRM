import 'dotenv/config'
import {
    Strategy as LocalStrategy
} from "passport-local";
import {
    Strategy as GoogleStrategy
} from 'passport-google-oauth20';

import User from "../models/User.js";
import Invite from '../models/Invite.js';
import Team from '../models/Team.js';

import bcrypt from 'bcrypt';


export default function async (passport) {
    // legacy strategy
    passport.use(
        new LocalStrategy({
                usernameField: 'email',
                passwordField: 'password',
            },
            async (email, password, done) => {
                try {
                    const user = await User.findOne({
                        email
                    });
                    if (!user) return done(null, false, {
                        message: 'Email Not Registered'
                    });

                    const isMatch = await bcrypt.compare(password, user.password);
                    if (!isMatch) return done(null, false, {
                        message: 'Incorrect Password'
                    });

                    return done(null, user);
                } catch (err) {
                    return done(err)
                }
            }
        )
    )

    // google strategy
    passport.use(
        new GoogleStrategy({
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: "/oauth2/google/callback",
                passReqToCallback: true
            },
            async (req, accessToken, refreshToken, profile, done) => {
                try {
                    let user = await User.findOne({
                        googleId: profile.id
                    });

                    if (user) {
                        // check for refresh token IM ON A HIGHWAY TO HELLLLLLLL 
                        if(refreshToken && !user.googleRefreshToken){
                            user.googleRefreshToken = refreshToken;
                            await user.save();
                        }
                        req.session.tempGoogleAccessToken = accessToken;
                        return done(null, user);
                    }
                    const existingEmailUser = await User.findOne({
                        email: profile.emails[0].value
                    });

                    if (existingEmailUser) {
                        if (!existingEmailUser.googleId) {
                            existingEmailUser.googleId = profile.id;
                        }

                        const googlePic = profile.photos?.[0]?.value;
                        if (googlePic && (!existingEmailUser.profilePicture || existingEmailUser.profilePicture !== googlePic)) {
                            existingEmailUser.profilePicture = googlePic;
                        }


                        await existingEmailUser.save();
                        return done(null, existingEmailUser);
                        
                    }

                    const invite = req.session.oauthInvite;
                    delete req.session.oauthInvite;

                    const newUser = await User.create({
                        firstName: profile.name?.givenName || "Google",
                        lastName: profile.name?.familyName || "User",
                        email: profile.emails[0].value,
                        accountCreation: new Date(),
                        acceptedTos: true,
                        admin: false,
                        googleId: profile.id,
                        profilePicture: profile.photos[0].value,
                        verified: true,
                        googleRefreshToken: refreshToken
                    });

                    if (invite && invite.token && invite.role === 'team') {
                        const inviteDoc = await Invite.findOne({
                            token: invite.token
                        }).populate('team');
                        const team = await Team.findById(inviteDoc?.team);
                        if (inviteDoc && !inviteDoc.accepted && inviteDoc.email === newUser.email) {
                            newUser.teamMemberOf.push({
                                team: team._id,
                                role: inviteDoc.teamRole || null,
                                department: inviteDoc.department || null
                            });
                            team.members.push(newUser._id);
                            await team.save();
                            inviteDoc.accepted = true;
                            inviteDoc.linkedUser = newUser._id;
                            await inviteDoc.save();
                        }
                    } else if (invite && invite.token && invite.role === 'client') {
                        const inviteDoc = await Invite.findOne({
                            token: invite.token,
                            role: 'client'
                        });
                        if (inviteDoc && !inviteDoc.accepted) {
                            if (inviteDoc.project) {
                                newUser.clientOf.push(inviteDoc.project);
                            }
                            inviteDoc.accepted = true;
                            inviteDoc.linkedUser = newUser._id;
                            await inviteDoc.save();
                        }
                    } else {
                        // for normal users create a noirmal team yea
                        const newTeam = new Team({
                            name: `${newUser.firstName}'s Team`,
                            owner: newUser._id,
                            members: [newUser._id],
                            createdAt: new Date()
                        });
                        await newTeam.save();
                        newUser.teamOwnerOf.push(newTeam._id);
                        newUser.teamMemberOf.push({
                            team: newTeam._id,
                            role: 'owner',
                            department: 'general'
                        });
                    }

                    await newUser.save();
                    req.session.tempGoogleAccessToken = accessToken;
                    return done(null, newUser);
                } catch (err) {
                    return done(err, null);
                }
            }
        )
    );


    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null)
        }
    });
}