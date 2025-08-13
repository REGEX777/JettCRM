import express from 'express';
import mongoose, { connect } from 'mongoose';
import bcrypt from 'bcrypt';

import crypto from 'crypto'

import { validationResult } from 'express-validator';

import { Resend } from 'resend';


// Middleware Import
import { validateEmail } from '../../middleware/emailValidator.js';
import { isLoggedOut } from '../../middleware/isLoggedOut.js';

// model import
import User from '../../models/User.js';
import Team from '../../models/Team.js';
import Invite from '../../models/Invite.js';

const router = express.Router();

const resend = new Resend(process.env.RESEND_KEY)


router.post('/', validateEmail, isLoggedOut, async (req, res) => {
    const { token, role } = req.body; 
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            req.flash('error', errorMessages);
            return res.redirect('/signup');
        }

        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            req.flash('error', 'The email you entered is already in use.');
            return res.redirect('/signup');
        }

        const token = crypto.randomBytes(Math.ceil(18/2)).toString('hex').slice(0, 18)


        const hash = await bcrypt.hash(req.body.password, 12);
        const newUser = new User({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: hash,
            createdAt: new Date(),
            acceptedTos: req.body.acceptedTos || false,
            admin: false,
            googleId: null,
            teamOwnerOf: [],
            teamMemberOf: [],
            clientOf: [],


            verificationToken: token
        });

        if (token && role === "team") {
            const invite = await Invite.findOne({ token }).populate('team');
            const team = await Team.findOne({_id: invite.team})
            if (!invite || invite.accepted || invite.role !== 'team') {
                req.flash('error', 'This invite is invalid.');
                return res.redirect('/signup');
            }

            if(invite.email != req.body.email){
                req.flash('error', "Please use the email on which the invite was sent.")
                return res.redirect('/signup')
            }
 
            newUser.teamMemberOf.push({
                team: invite.team._id,
                role: invite.teamRole || null,
                department: invite.department || null
            });

            team.members.push(newUser._id);

            await newUser.save();
            await team.save();
            invite.accepted = true;
            invite.linkedUser = newUser._id;
            await invite.save();

        } else if (token && role === "client") {
            const invite = await Invite.findOne({ token, role: 'client' });

            if (!invite || invite.accepted) {
                req.flash("error", "This invite is invalid");
                return res.redirect('/signup');
            }

            if (invite.project) {
                newUser.clientOf.push(invite.project);
            }

            await newUser.save();

            invite.accepted = true;
            invite.linkedUser = newUser._id;
            await invite.save();

        } else { 
            const newTeam = new Team({
                name: `${req.body.firstName}'s Team`,
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

            await newUser.save();
        }

        const { data, error } = await resend.emails.send({
        from: 'verify@thesmartscribe.com',
        to: [newUser.email],
        subject: 'Verify your JettCRM account',
        html: `<!doctype html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>Email Verification</title>
                </head>
                <body style="margin:0;padding:0;background-color:#ffffff;font-family:Inter,Arial,sans-serif;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-spacing:0;background-color:#fff;">
                    <tr>
                        <td align="center" style="padding:40px 20px;background-image:repeating-linear-gradient(315deg,rgba(17,24,39,0.05) 0,rgba(17,24,39,0.05) 1px,transparent 0,transparent 50%);background-size:10px 10px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#f3f4f6;border-radius:12px;padding:8px;">
                            <tr>
                            <td style="background-color:#ffffff;border-radius:12px;padding:40px;color:#374151;line-height:1.6;box-shadow:0 4px 20px rgba(0,0,0,0.05);">
                                <p style="margin:0 0 16px;">Welcome to <strong>JettCRM</strong> — let’s get your account ready!</p>
                                <p style="margin:0 0 16px;">Please verify your email address to complete your setup.</p>

                                <div style="text-align:center;margin:32px 0;">
                                <a href="http://localhost:9000/verify/${token}" style="display:inline-block;padding:12px 28px;background:linear-gradient(to right,#7c3aed,#d946ef);color:#ffffff;font-weight:600;font-size:16px;text-decoration:none;border-radius:8px;"> Verify Email </a>
                                </div>

                                <hr style="border:none;border-top:1px solid rgba(17,24,39,0.1);margin:24px 0;" />

                                <p style="margin:0 0 8px;">If you didn’t request this, you can ignore this email.</p>
                                <p style="margin:0;font-size:14px;color:#6b7280;">Thanks, <br />The JettCRM Team</p>
                            </td>
                            </tr>
                        </table>

                        <p style="margin-top:24px;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} JettCRM. All rights reserved.</p>
                        </td>
                    </tr>
                    </table>
                </body>
                </html>
                `
        });


        if (error) {
            console.error('Resend email error:', error);
        } else {
            console.log('Email sent successfully:', data);
        }


        req.login(newUser, (err) => {
            if (err) return res.status(500).send(err);
            req.flash('success', 'Congratulations! You have signed up successfully, please check your mails to verify your account.');
            if(req.cookies.inviteInfo){
                const inviteToken = req.cookies.inviteInfo.token;
                res.clearCookie('inviteInfo');
                return res.redirect(`/invite/accept/${inviteToken}`);
            } else {
                return res.redirect('/');
            }
            
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});


export default router;