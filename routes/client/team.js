import express from 'express';
import crypto from 'crypto';
import Team from '../../models/Team.js';
import Invite from '../../models/Invite.js';
import User from '../../models/User.js';

import { Resend } from 'resend';

const router = express.Router();


const resend = new Resend(process.env.RESEND_KEY)

router.get('/',async (req, res)=>{
    try{
        const user = req.user;
        const team = await Team.findOne({owner: user._id});

        if (!team) {
            req.flash('error', 'No team found.');
            return res.redirect('/dashboard');
        }

        const teammates = await User.find({
            'teamMemberOf.team': team._id
        });
        const headerText = "My Team"
        const backBtnLink = '/team'
        res.render('team/team', {
            team,
            teammates,
            headerText,
            backBtnLink
        });
    }catch(err){
        console.log(err)
        res.status(500).send('Internal Server Error')
    }
});


router.get('/api/search', async (req, res) => {
    try {
        const rawQuery = req.query.query?.trim() || '';
        const user = req.user;

        const team = await Team.findOne({ owner: user._id });
        if (!team) return res.status(404).json([]);

        const terms = rawQuery.split(/\s+/).filter(Boolean);

        const conditions = terms.map(term => ({
            $or: [
                { firstName: new RegExp(term, 'i') },
                { lastName: new RegExp(term, 'i') },
                { email: new RegExp(term, 'i') }
            ]
        }));

        const members = await User.find({
            'teamMemberOf.team': team._id,
            $and: conditions
        }).lean();

        members.forEach(m => {
            m.membership = m.teamMemberOf.find(tm => tm.team.toString() === team._id.toString());
        });

        res.json(members);
    } catch (err) {
        console.error(err);
        res.status(500).json([]);
    }
});

router.get('/add', (req, res)=>{
    const headerText = "Invite Team Members"
    const backBtnLink = '/team'
    res.render('team/addTeam', {headerText, backBtnLink})
})

router.post('/invite',async (req, res)=>{
    try{
        const {name, email, teamRole, department} = req.body;
        if(!name||!email||!teamRole||!department){
            req.flash('error', 'All fields are required');
            return res.redirect('/team/add')
        }

        const team = await Team.findOne({ members:req.user._id });
        if(!team){
            req.flash('error', 'Your team could not be found')
            return res.redirect('/team/add')
        }

        const existingInvite = await Invite.findOne({
            email,
            team: team._id,
            role: 'team'
        })

        if(existingInvite){
            req.flash('error', 'This person has already been invited to your team')
            return res.redirect('/team/add')
        }
        const token = crypto.randomBytes(24).toString('hex');

        const invite = new Invite({
            email,
            token,
            type: 'team',
            team: team._id,
            invitedBy: req.user._id,
            teamRole,
            department
        })

        await invite.save();

        

        const { data, error } = await resend.emails.send({
            from: 'invite@thesmartscribe.com',
            to: [invite.email],
            subject: 'Invitation to join a project as a team member.',
            html: `<a href="https://jettcrm.thesmartscribe.com/invite/accept/${token}">Accept Invite</a>`
        });


        if (error) {
            console.error('Resend email error:', error);
        } else {
            console.log('Email sent successfully:', data);
        }


        req.flash('success', `Invitation email sent to ${email}`)
        res.redirect('/team/add')
    }catch(err){
        console.log(err)
        res.status(500).send('Internal Server Error')
    }
})

export default router;