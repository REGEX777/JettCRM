import 'dotenv/config'
import {
    Strategy as LocalStrategy
} from "passport-local";
import {
    Strategy as GoogleStrategy
} from 'passport-google-oauth20';

import User from "../models/User.js";
import bcrypt from 'bcrypt';

export default function (passport) {
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
    new GoogleStrategy(
        {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/oauth2/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ googleId: profile.id });

            if (user) return done(null, user);

            const existingEmailUser = await User.findOne({ email: profile.emails[0].value });

            if (existingEmailUser) {
            existingEmailUser.googleId = profile.id;
            await existingEmailUser.save();
            return done(null, existingEmailUser);
            }

            const newUser = await User.create({
            firstName: profile.name?.givenName || "Google",
            lastName: profile.name?.familyName || "User",
            email: profile.emails[0].value,
            accountCreation: new Date(),
            acceptedTos: true, 
            admin: false,
            googleId: profile.id,
            });

            return done(null, newUser);
        } catch (err) {
            return done(err, null);
        }
        }
    )
    );


    passport.serializeUser((user, done)=>{
        done(null, user.id);
    });

    passport.deserializeUser(async(id, done)=>{
        try{
            const user = await User.findById(id);
            done(null, user);
        }catch(err){
            done(err, null)
        }
    });
}