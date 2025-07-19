import express from 'express';
import bcrypt from 'bcrypt';

// model import 
import Invite from '../../models/Invite.js';
import User from '../../models/User.js';
import Team from '../../models/Team.js';
import Project from '../../models/Projects.js';

const router = express.Router();

router.get('/accept/:token', async (req, res) => {
    const token = req.params.token;

    try {
        const invite = await Invite.findOne({ token }).populate('team invitedBy project');
        if (!invite) {
            return res.status(404).send("Invite is invalid or expired.");
        }

        if (invite.accepted) {
            return res.status(400).send("This invite has already been accepted.");
        }

        const maxAgeMs = 7 * 24 * 60 * 60 * 1000; 
        const isExpired = Date.now() - new Date(invite.createdAt).getTime() > maxAgeMs;
        if (isExpired) {
            req.flash('error', 'Invite has expired.');
            return res.redirect('/');
        }

        const invitedEmail = invite.email;
        const existingUser = await User.findOne({ email: invitedEmail });
        const viewData = {
            invite,
            project: invite.project,
            teamOrProjectName: invite.team?.name || invite.project?.name || 'Project',
            roleLabel: invite.teamRole || invite.role,
            department: invite.department || null
        };
        // if user exists
        if (existingUser) {
            if (!req.isAuthenticated || !req.isAuthenticated()) {
                res.cookie('inviteInfo', {
                    token: invite.token,
                    role: invite.role
                }, {
                    maxAge: 5 * 60 * 1000,
                    httpOnly: true
                });
                return res.redirect('/login');
            }

            if (req.user.email !== invitedEmail) {
                req.flash('error', 'The invite does not exist for this account.');
                return res.redirect('/');
            }

            if(invite.type === 'client'){
                return res.render('invite/client_invite', viewData);
            }

            return res.render('invite/confirm_join', viewData);
        }

        if (req.isAuthenticated && req.isAuthenticated()) {
            req.flash('error', 'You are already logged in. Please log out to create a new account.');
            return res.redirect('/');
        }


        const viewToRender = invite.type === 'client' ? 'invite/client_invite' : 'signup';
        return res.render(viewToRender, viewData);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/accept', async (req, res) => {
    const { token } = req.body;

    try {
        const invite = await Invite.findOne({ token }).populate('team project');
        if (!invite) {
            req.flash('error', "Invalid or expired invite.");
            return res.redirect('/');
        }

        if (invite.accepted) {
            req.flash('error', "This invite has already been accepted.");
            return res.redirect('/');
        }

        const existingUser = await User.findOne({ email: invite.email });
        if (!existingUser) {
            res.cookie('inviteInfo', {
                token: invite.token
            }, {
                maxAge: 5 * 60 * 1000,
                httpOnly: true
            });
            return res.redirect('/signup');
        }
 
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            res.cookie('inviteInfo', JSON.stringify({
                token: invite.token,
                role: invite.role
            }), {
                maxAge: 5 * 60 * 1000,
                httpOnly: true
            });
            return res.redirect('/login');
        }
        
        if(invite.type === 'client'){
            const project = invite.project;
            if(!project){
                req.flash('error', 'The project associated with this invite no longer exists.');
                return res.redirect('/');
            }

            project.client = req.user._id;
            await project.save();


            req.flash('success', `Youve succesfully joined ${project.name}`)
            invite.accepted = true;
            invite.linkedUser = req.user._id;


            await Promise.all([invite.save(), req.user.save()]);
            res.clearCookie('inviteInfo');
            return res.redirect(`/project/${project._id}`)
        }

        if (req.user.email !== invite.email) {
            req.flash('error', 'This invite was sent to a different email. Please log in with the correct account.');
            return res.redirect('/logout');
        }

        const team = invite.team;
        if (!team) {
            req.flash('error', 'The team associated with this invite no longer exists.');
            return res.redirect('/');
        }
 
        if (!team.members.some(id => id.toString() === req.user._id.toString())){
            team.members.push(req.user._id);
        }
 
        const alreadyMember = req.user.teamMemberOf.some(m =>
            m.team.toString() === team._id.toString()
        );

        if (!alreadyMember) {
            req.user.teamMemberOf.push({
                team: team._id,
                role: invite.teamRole || null,
                department: invite.department || null
            });
        }

        invite.accepted = true;
        invite.linkedUser = req.user._id;

        await Promise.all([team.save(), req.user.save(), invite.save()]);

        req.flash('success', `You've successfully joined ${team.name}`);
        res.clearCookie('inviteInfo');
        res.redirect('/team');

    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

export default router;