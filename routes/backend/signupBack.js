import express from 'express';
import mongoose, { connect } from 'mongoose';
import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';

// Middleware Import
import { validateEmail } from '../../middleware/emailValidator.js';
import { isLoggedOut } from '../../middleware/isLoggedOut.js';

// model import
import User from '../../models/User.js';
import Team from '../../models/Team.js';
import Invite from '../../models/Invite.js';

const router = express.Router();


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
            clientOf: []
        });

        if (token && role === "team") {
            const invite = await Invite.findOne({ token }).populate('team');
            if (!invite || invite.accepted || invite.role !== 'team') {
                req.flash('error', 'This invite is invalid.');
                return res.redirect('/signup');
            }
 
            newUser.teamMemberOf.push({
                team: invite.team._id,
                role: invite.teamRole || null,
                department: invite.department || null
            });

            await newUser.save();

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

        req.login(newUser, (err) => {
            if (err) return res.status(500).send(err);
            req.flash('success', 'Congratulations! You have signed up successfully, please check your mails to verify your account.');
            return res.redirect('/');
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});


export default router;