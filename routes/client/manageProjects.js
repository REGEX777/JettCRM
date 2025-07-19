import express from 'express';
import crypto from 'crypto'

// model import
import mongoose from 'mongoose';
import Project from '../../models/Projects.js';
import Team from '../../models/Team.js';
import User from '../../models/User.js';
import Invite from '../../models/Invite.js';

const router = express.Router();


router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 6;
        const skip = (page - 1) * limit;

        const team = await Team.findOne({owner: req.user._id}).populate({
            path: 'projects',
            populate: {
                path: 'client'
            }
        });

        if (!team) {
            req.flash('error', 'Team not found');
            return res.redirect('/dashboard');
        }

        const allProjects = team.projects;
        const totalProjects = allProjects.length;
        const totalPages = Math.ceil(totalProjects / limit);
        const paginatedProjects = allProjects.slice(skip, skip + limit);

        res.render('project_dash/manageProjects', {
            projects: paginatedProjects,
            currentPage: page,
            totalPages,
            totalProjects,
            success: req.flash('success'),
            error: req.flash('error'),
            startIndex: skip + 1,
            endIndex: Math.min(skip + limit, totalProjects)
        });
    } catch (err) {
        console.log(err)
        res.status(500).send('Internal Server Error')
    }
})


router.get('/add', async (req, res) => {
    try {
        const team = await Team.findOne({
            owner: req.user._id
        }).populate('members');

        if (!team) {
            req.flash('error', 'Your team could not be found.');
            return res.redirect('/projects');
        }

        const members = team.members.map(member => ({
            id: member._id,
            name: `${member.firstName} ${member.lastName}`,
            email: member.email
        }))

        res.render('project_dash/addProjects', {
            members
        })

    } catch (err) {
        console.log(err)
        return res.status(500).send("Internal Server Error")
    }
})

router.post("/", async (req, res) => {
    try {
        const {
            projectTitle,
            clientEmail,
            startDate,
            deadline,
            priority,
            projectDescription,
            projectBudget,
            projectTeam,
            projectTags
        } = req.body;

        if (!projectTitle || typeof projectTitle != "string")
            return res.status(400).send("Invalid or missing Project Title")

        const team = await Team.findOne({
            owner: req.user._id
        });

        const user = await User.findOne({email: clientEmail});


        const token = crypto.randomBytes(24).toString('hex');



        const parsedStartDate = new Date(startDate);
        const parsedDeadlineDate = new Date(deadline);

        if (isNaN(parsedStartDate) || isNaN(parsedDeadlineDate))
            return res.status(400).send("Invalid start or deadline date");

        if (!["low", "medium", "high"].includes(priority.toLowerCase()))
            return res.status(400).send("Priority must be low medium or high");

        const parsedBudget = parseFloat(projectBudget);

        if (isNaN(parsedBudget))
            return res.status(400).send("Invalid budget amount");

        const teamMembers = Array.isArray(projectTeam) ? projectTeam : [projectTeam];

        const tags = projectTags ?
            String(projectTags).split(",").map(tag => tag.trim()).filter(tag => tag) :
            [];

        const project = new Project({
            name: projectTitle,
            clientEmail: clientEmail || "",
            team: team._id,
            startDate: parsedStartDate,
            deadlineDate: parsedDeadlineDate,
            priority: priority.toLowerCase(),
            description: projectDescription || "",
            budget: parsedBudget,
            assignedTeammates: teamMembers,
            tags: tags,
            fileNames: []
        })

        await project.save();
        team.projects.push(project._id);
        await team.save();
        // implement email leater so for now just loggin it
        const invite = new Invite({
            email: clientEmail,
            token,
            type: 'client',
            project: project._id,
            invitedBy: req.user._id
        })

        await invite.save();

        console.log(`client invite: https:/localhost:9000/invite/accept/${token}`)

        res.status(200).send("Project Created Succesfully")

    } catch (err) {
        res.send(err)
        console.log(err)
    }
})

router.get('/delete/:id', async (req, res)=>{
    const projectId = req.params.id;
    try{
        const project = await Project.findOne({_id: projectId}).populate('team');
        if(!project){
            req.flash('error', 'Project Not Found')
            return res.redirect('/projects')
        }
        const team = project.team;
        if (!team.owner.equals(req.user._id)) {
            req.flash('error', 'Unauthorized');
            return res.redirect('/projects');
        }

        team.projects = team.projects.filter(pId => pId.toString() !== projectId);
        await team.save();

        await Project.findOneAndDelete(projectId)

        req.flash('error', "Project Deleted Succesfully")
        res.redirect('/projects')
    }catch(err){
        console.log(err)
        res.status(500).send('Internal Server Error')
    }
})


// task manager

// 1 find the project reffered from the id
// 2 the project schema should have an array which will contain javascript arrays 
// that will store the task title, description, assigned to variable and created/deadline date 

router.get('/taskmanager/:id', async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await Project.findOne({
            _id: projectId
        }).populate('assignedTeammates')
        if (!project) {
            req.flash('error', 'We could not find the project.')
            return res.redirect('/projects')
        }
        const team = project.assignedTeammates
        res.render('taskmanager/taskmanager', {
            project,
            team
        })
    } catch (err) {
        console.log(err)
        return res.status(500).send('Internal Server Error')
    }
})


router.post('/taskmanager/:id', async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await Project.findOne({
            _id: projectId
        });

        if (!project) {
            req.flash('error', 'We could not find the project')
            return res.redirect('/projects')
        }


        const task = {
            taskname: req.body.taskname,
            taskdescription: req.body.taskdescription,
            teammates: req.body.teammates,
            deadlineDate: new Date(req.body.deadline)
        }

        const updatedProject = await Project.findByIdAndUpdate(
            projectId, {
                $push: {
                    tasks: task
                }
            }, {
                new: true
            },
        ).populate('tasks.teammates')

        if (!updatedProject) {
            return res.status(404).send('Project not found')
        }

        res.json(updatedProject)
    } catch (err) {
        console.log(err)
        res.status(500).send('Internal Server Error')
    }
})



export default router;