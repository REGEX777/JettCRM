// implement team dash
import express from 'express';

const router = express.Router();
// model import
import User from '../../models/User.js';
import Team from '../../models/Team.js';
import Project from '../../models/Projects.js'

router.get('/', async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('teamMemberOf.team');
        const teams = user.teamMemberOf.map(member => ({
            id: member.team._id,
            name: member.team.name,
            role: member.role,
            department: member.department
        }));

        res.render('myteam/dash', { teams });
    } catch (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/:id', async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).send('Team not found');
        }

        const isMember = team.members.some(id => id.equals(req.user._id));
        if (!isMember) {
            return res.send('You do not have access to this team');
        }
        
        const projects = await Project.find({
            team: team._id,
            assignedTeammates: req.user._id
        }) 

        res.render('myteam/view', { team, projects });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});



export default router;