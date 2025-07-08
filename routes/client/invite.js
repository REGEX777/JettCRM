import express from 'express';
import bcrypt from 'bcrypt';

// model import 
import Invite from '../../models/Invite.js';
import User from '../../models/User.js';
import Team from '../../models/Team.js';

const router = express.Router();

router.get('/accept/:token', async(req, res)=>{
    const token = req.params.token;
    try{
        const invite = await Invite.findOne({token}).populate('team invitedBy');
        if(!invite){
            return res.status(404).send("Invite is Invalid or expired.")
        }
        if(invite.accepted){
            return res.status(400).send("Invite is no longer valid")
        }

        const inviterName = invite.invitedBy?.firstName || null;

        return res.redirect(`/signup?token=${token}&role=${invite.role}&inviter=${encodeURIComponent(inviterName)}`);
    }catch(err){
        console.log(err);
        res.status(500).send('Internal Server Error')
    }
})

router.post('/accept', async (req, res)=>{
    const token = req.body.token;
    const { firstName, lastName, password, confirmPassword, email } = req.body;
    try{
        const invite = await Invite.findOne({token});
        if(!invite){
            req.flash('error', "Invalid or Expire Invite.")
            return res.redirect('/auth/signup')
        }

        if(!password || !confirmPassword || password != confirmPassword){
            req.flash('Passwords do not match or are missing')
            return res.redirect(`/invite/accept/${token}`)
        }

        if(email != invite.email){
            req.flash('error', 'Please use the email this invite was sent to.')
            return res.redirect(`/invite/accept/${token}`)
        }

        const existingUser = await User.findOne({ email: invite.email });
        if(existingUser){
            req.flash('error', 'User with this email already exists.')
            return res.redirect('/login')
        }

        const hash = await bcrypt.hash(password, 12);

        const newUser = new User({
            firstName: firstName || invite.firstName || '',
            lastName: lastName || invite.lastName || '',
            email: invite.email,
            password: hash,
            accountCreation: new Date(),
            admin: false,
            isTeamOwner: false
        });

        await newUser.save();

        const team = await Team.findOne({ teamOwner: invite.teamOwner });

        if(team){
            team.member.push(newUser._id)
            await team.save();
        }

        await Invite.deleteOne({_id: invite._id})

        req.login(newUser, (err)=>{
            if(err){
                console.log(err);
                req.flash('error', 'Something went wrong while trying to log you in.')
                return res.redirect('/auth/login');
            }

            req.flash('success', "Welcome Aboard, You've successfully joined the team!");
            res.redirect('')
        })

    }catch(err){
        console.log(err)
        res.status(500).send('Internal Server Error')
    }
})

export default router;