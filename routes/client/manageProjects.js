import express from 'express';
import crypto from 'crypto'
import { Resend } from 'resend';

// model import
import mongoose from 'mongoose';
import Project from '../../models/Projects.js';
import Team from '../../models/Team.js';
import User from '../../models/User.js';
import Invite from '../../models/Invite.js';

const router = express.Router();

const resend = new Resend(process.env.RESEND_KEY)

// Utility Import
import { uploadInvoice } from '../../utils/multerConfig.js';

router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 6;
        const skip = (page - 1) * limit;
        const sort = req.query.sort || 'newest';
        const status = req.query.status || 'all';
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

        let filteredProjects = [...team.projects];
        if (status !== 'all') {
            filteredProjects = filteredProjects.filter(project =>
                status === 'completed'
                ? project.status === 'completed'
                : project.status !== 'completed'
            );
        }


        switch (sort) {
            case 'oldest':
                filteredProjects.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'az':
                filteredProjects.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'za':
                filteredProjects.sort((a, b) => b.name.localeCompare(a.name));
                break;
            default:
                filteredProjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }


        const totalProjects = filteredProjects.length;
        const totalPages = Math.ceil(totalProjects / limit);
        const paginatedProjects = filteredProjects.slice(skip, skip + limit);

        const headerText = `Manage Projects`
        const backBtnLink = '/dashboard'
        res.render('project_dash/manageProjects', {
            projects: paginatedProjects,
            currentPage: page,
            totalPages,
            totalProjects,
            startIndex: skip + 1,
            endIndex: Math.min(skip + limit, totalProjects),
            status,
            sort,
            headerText,
            backBtnLink
        });
    } catch (err) {
        console.log(err)
        res.status(500).send('Internal Server Error')
    }
})


// Search
router.get('/search',async (req, res)=>{
    const query = req.query.q?.trim().toLowerCase();
    if(!query) return res.json([]);

    try{
        const team = await Team.findOne({owner: req.user._id}).populate({
            path: 'projects',
            populate: { path: 'client'}
        })

        if(!team) return res.json([]);

        const filtered = team.projects.filter(project =>
            project.name.toLowerCase().includes(query) ||
            (project.client?.email || '').toLowerCase().includes(query)
        );

        res.json(filtered.map(p => ({
            id: p._id,
            name: p.name,
            clientEmail: p.client?.email || '',
            status: p.status,
            createdAt: p.createdAt
        })));

    }catch(err){
        console.log(err)
        res.status(500).send('Internal Server Error')
    }
})


// project with tasks
router.get('/v/:id', async (req, res)=>{
    const projectId = req.params.id;
    if(!projectId){
        req.flash('error', 'Invalid Project ID.')
        return res.redirect('/projects')
    }



    try{
        const project = await Project.findOne({_id: projectId})
            .populate('team')
            .populate('assignedTeammates')
            .populate('tasks.teammates')
            .populate('client');

        if(!project){
            req.flash('error', "Project Not Found")
            res.redirect('/projects')
        }
        if(!project.team.owner.equals(req.user._id)){
            req.flash('error', "Unauthorized")
            return res.redirect('/projects')
        }

        const team = await Team.findById(project.team._id).populate('members');

        const headerText = "Project View"
        const backBtnLink = '/projects'

        res.render('project_dash/project', {project, headerText, backBtnLink, teammates: team.members})
    }catch(err){
        console.log(err)
        res.status(500).send('Internal Server Error')
    }
})

// APIss

router.post('/:id/members/add', async (req, res)=>{
    try{
        const projectId = req.params.id;
        const {memberId} = req.body;

        const project = await Project.findById(projectId).populate('assignedTeammates').populate('team')

        if(!project){
            req.flash('error', 'Project Not Found')
            res.redirect(`/projects/v/${projectId}`)
        }

        if(!project.team.owner.equals(req.user._id)){
            req.flash('error', 'Unauthorized')
            res.redirect('/projects')
        }

        if (!project.assignedTeammates.some(tm => tm._id.equals(memberId))) {
            project.assignedTeammates.push(memberId);
            await project.save();
        }

        const team = await Team.findById(project.team._id).populate('members');

        const assignedTeammates = await Project.findById(projectId).populate('assignedTeammates').then(p => p.assignedTeammates);

        const availableTeammates = team.members.filter(tm =>
            !assignedTeammates.some(am => am._id.equals(tm._id))
        );

        res.json({ assignedTeammates, availableTeammates });
    }catch(err){
        console.log(err)
        res.status(500).send("Internal Server Error")
    }
})



router.post('/:id/members/remove', async (req, res)=>{
 try {
    const projectId = req.params.id;
    const { memberId } = req.body;

    const project = await Project.findById(projectId).populate('assignedTeammates').populate('team');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.team.owner.equals(req.user._id)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    project.assignedTeammates = project.assignedTeammates.filter(
      tm => !tm._id.equals(memberId)
    );
    await project.save();

    const team = await Team.findById(project.team._id).populate('members');
    const assignedTeammates = await Project.findById(projectId)
      .populate('assignedTeammates')
      .then(p => p.assignedTeammates);

    const availableTeammates = team.members.filter(tm =>
      !assignedTeammates.some(am => am._id.equals(tm._id))
    );

    res.json({ assignedTeammates, availableTeammates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




router.get('/v/updates/:id',async (req, res)=>{
    const projectId = req.params.id;
    try{
        const project = await Project.findOne({_id: projectId}).populate('team');
        if(!project){
            req.flash('error', 'Project Not Found')
            return res.redirect(`/projects/v/${projectId}`)
        }

        if(!project.team.owner.equals(req.user._id)){
            req.flash('error', 'Unauthorized')
            return res.redirect(`/projects/v/${projectId}`)
        }

        res.render('project_dash/projectUpdate', {project})
    }catch(err){
        console.log(err);
        res.status(500).send('Internal Server Error')
    }
})

// edit route

router.get('/edit/:id',async (req, res)=>{
    const projectId = req.params.id;
    if(!projectId){
        req.flash('error', 'Invalid Project ID')
        res.redirect('/projects')
    }
    try{
        const project = await Project.findOne({_id: projectId}).populate({
            path: 'team',
            populate:{
                path: 'members'
            }
        });
        if(!project){
            req.flash('error', 'Not Found')
            return res.redirect('/projects')
        }

        if(!project.team.owner.equals(req.user._id)){
            req.flash('error', 'Unauthorized')
            return res.redirect('/projects')
        }

        const headerText = "Project Edit"
        const backBtnLink = '/projects'
        res.render('project_dash/editProject', {project, members: project.team.members, headerText, backBtnLink})

    }catch(err){
        console.log(err)
        res.status(500).send('Internal Server Error')
    }
})


router.post('/edit/:id',async (req, res)=>{
    const projectId = req.params.id;
    if(!projectId){
        req.flash('error', 'Invalid Project ID')
        res.redirect('/projects')
    }
    try{
        const {
            projectTitle,
            clientEmail,
            deadline,
            projectDescription,
            projectBudget,
            projectTeam
        } = req.body;

        const project = await Project.findOne({_id: projectId}).populate('team');

        if (!project) {
            req.flash('error', 'Project not found');
            return res.redirect('/projects');
        }

        if (!project.team.owner.equals(req.user._id)) {
            req.flash('error', 'Unauthorized');
            return res.redirect('/projects');
        }

        
        const parsedDeadlineDate = new Date(deadline);
        const parsedBudget = parseFloat(projectBudget);

        const teamMembers = Array.isArray(projectTeam) ? projectTeam : [projectTeam];

        project.name = projectTitle || project.name;
        project.clientEmail = clientEmail || '';
        project.deadlineDate = isNaN(parsedDeadlineDate) ? project.deadlineDate : parsedDeadlineDate;
        project.description = projectDescription || '';
        project.budget = isNaN(parsedBudget) ? project.budget : parsedBudget;
        project.assignedTeammates = teamMembers;
        

        await project.save();


        req.flash('success', 'The project was updated successfully')
        return res.redirect('/projects')
    }catch(err){
        console.log(err);
        return res.status(500).send('Internal Server Error')
    }
})

// updates page
router.get('/update/:id', async (req, res)=>{
    const projectId = req.params.id; 
    try{
        const project = await Project.findOne({_id: projectId}).populate('team');
        if(project.status)
        if(!project){
            req.flash('error', 'Project Not Found')
            return res.redirect('/projects')
        }
        if(!project.team.owner.equals(req.user._id)){
            req.flash('error', "Unauthorized")
            return res.redirect('/projects')
        }  
        
        if (project.status === 'completed') {
            req.flash('error', 'This project is already marked as completed. No more updates allowed.');
            return res.redirect(`/projects/v/${projectId}`);
        }
        res.render('project_dash/updates', {project: project})
    }catch(err){
        console.log(err)
        return res.status(500).send('Internal Server Error')
    }
})


router.post('/update/:id', async (req, res)=>{
    const projectId = req.params.id;
    const { title, type, status, icon, content, link_text, link_url, markCompleted } = req.body;
    try{
        const project = await Project.findOne({_id: projectId}).populate('team');

        if(!project){
            req.flash('error', "Project not found")
            return res.redirect('/projects')
        }

        if(!project.team.owner.equals(req.user._id)){
            req.flash('error', 'Unauthorized')
            return res.redirect('/projects')
        }

        if (project.status === 'completed') {
            req.flash('error', 'This project is already marked as completed. No more updates allowed.');
            return res.redirect(`/projects/v/${projectId}`);
        }

        const relatedLinks = (Array.isArray(link_text) && Array.isArray(link_url))
            ? link_text.map((text, index) => ({
                linkTitle: text,
                link: link_url[index]
            }))
            : [];

        project.updates.push({
            title,
            uType: type,
            icon,
            details: content,
            relatedLinks,
            createdAt: new Date()
        })
        if (markCompleted === 'on') {
            project.status = 'completed';
            await project.save();
            req.flash('success', 'Project Marked Completed')
            return res.redirect(`/projects/v/${projectId}`)
        }
        await project.save();
        req.flash('success', 'Updated Successfully')
        res.redirect(`/projects/update/${projectId}`)
    }catch(err){
        console.log(err);
        res.status(500).send('Internal Server Error')
    }
})


router.get('/update/activate/:id', async (req, res)=>{
    const projectId = req.params.id;
    try{
        const project = await Project.findOne({_id: projectId}).populate('team');

        if(!project){
            req.flash('error', 'Project Not Found')
            return res.redirect(`/project/v/${projectId}`)
        }

        if(!project.team.owner.equals(req.user._id)){
            req.flash('error', 'Unauthorized')
            return res.redirect(`/project/v/${projectId}`)
        }

        if(project.status === "active"){
            req.flash('error', 'Project Is Already Active')
            return res.redirect(`/project/v/${projectId}`)
        }
        
        project.status = "active"

        await project.save();
        req.flash('success', "Successfully activated the project!")
        res.redirect(`/projects/v/${projectId}`)
    }catch(err){
        console.log(err);
        res.status(500).send('Internal Server Error')
    }
})


// feedback
router.post('/f/:projectId/update/:updateId/feedback', async (req, res)=>{
    const {projectId, updateId} = req.params;
    const comment = req.body.comment;

    try{
        console.log(comment)
        const project = await Project.findOne({_id: projectId});
        if(!project){
            req.flash('error', 'Project Not Found')
            return res.redirect(`/client/pv/${projectId}`)
        }

        const update = project.updates.id(updateId)
        if (!update){
            req.flash('error', 'Update Not Found')
            return res.status(404).send('Update not found')
        };
        
        update.feedbacks.push({ comment });
        await project.save();
        
        req.flash('success', 'Feedback Received')
        res.redirect(`/client/pv/${projectId}`)
    }catch(err){
        console.log(err);
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
        const headerText = 'Add New Project'
        const backBtnLink = '/projects'
        res.render('project_dash/addProjects', {
            members,
            headerText,
            backBtnLink
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
            budget,
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
            budget,
            deadlineDate: parsedDeadlineDate,
            description: projectDescription || "",
            budget: parsedBudget,
            assignedTeammates: teamMembers,
            tags: tags,
            fileNames: []
        })

        await project.save();
        team.projects.push(project._id);
        await team.save();
        
        const invite = new Invite({
            email: clientEmail,
            token,
            type: 'client',
            project: project._id,
            invitedBy: req.user._id
        })

        await invite.save();

        console.log(invite.email)

        const { data, error } = await resend.emails.send({
            from: 'invite@thesmartscribe.com',
            to: [`${invite.email}`],
            subject: 'Invitation to join a project as a client',
            html: `<a href="https://jettcrm.thesmartscribe.com/invite/accept/${token}">Accept Invite</a>`
        });


        if (error) {
            console.error('Resend email error:', error);
        } else {
            console.log('Email sent successfully:', data);
        }




        req.flash('success', 'Project Created Successfully!')
        res.redirect('/projects')

    } catch (err) {
        res.send(err)
        console.log(err)
    }
})


router.get('/v/expenses/:id', async (req, res)=>{
    const projectId = req.params.id;
    try{
        const project = await Project.findOne({_id: projectId}).populate('team');
        if(!project){
            req.flash('error', 'Project not found')
            return res.redirect('/projects')
        }

        if(!project.team.owner.equals(req.user._id)){
            req.flash('error', 'Unauthorized')    
            return res.redirect('/projects')
        }

        const expenses = project.expenses;
        res.render('project_dash/expense_tracker', { project, expenses });
    }catch(err){
        console.log(err)
        res.status(500).send('')
    }
})

router.post('/v/expenses/:id', uploadInvoice.single('invoice'), async (req, res) => {
    const projectId = req.params.id;
    const { title, amount, type, description } = req.body;
    const invoiceFile = req.file;
    try { 


        const project = await Project.findOne({ _id: projectId }).populate({
            path: 'team',
            populate: {
                path: 'owner'
            }
        });
        
        if (!project) {
            req.flash('error', 'Project not found.');
            return res.redirect('/projects');
        }
 
        if (!project.team.owner._id.equals(req.user._id)) {
            req.flash('error', 'Unauthorized.');
            return res.redirect('/projects');
        }
 
        const newExpense = {
            title: title?.trim(),
            amount: parseFloat(amount),
            type: type?.trim(),
            description: description?.trim() || '',
            invoicePath: invoiceFile?.path.replace(/^.*uploads[\\/]/, '/uploads/')
        };

        project.expenses.push(newExpense);
        await project.save();

        req.flash('success', 'Expense added successfully!');
        res.redirect(`/projects/v/expenses/${projectId}`);

    } catch(err) {
        console.error('Error adding expense:', err);
        req.flash('error', 'Failed to add expense.');
        res.redirect(`/projects/v/expenses/${projectId}`);
    }
});

router.post('/v/update/budget/:id', async (req, res) => {
  const projectId = req.params.id;
  const { budget } = req.body;

  try {
    const project = await Project.findById(projectId).populate('team');

    if (!project) {
      req.flash('error', 'Project not found');
      return res.redirect('/projects');
    }

    if (!project.team.owner.equals(req.user._id)) {
      req.flash('error', 'Unauthorized');
      return res.redirect('/projects');
    }
    console.log(req.body)
    project.budget = budget;
    project.updates.push({
        title: `PM Updated the budget to $ ${budget}`,
        uType: 'alert',
        icon: 'exclamation',
        createdAt: new Date()
    })
    await project.save();

    req.flash('success', 'Budget updated successfully');
    res.redirect(`/projects/v/expenses/${projectId}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong');
    res.redirect('/projects');
  }
});





router.get('/delete/:id', async (req, res)=>{
    const projectId = req.params.id;
    if(!projectId){
        req.flash('error', 'Invalid Project ID')
        res.redirect('/projects')
    }
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
        if(!projectId){
            req.flash('error', 'Invalid Project ID')
            res.redirect('/projects')
        }
        const project = await Project.findOne({
            _id: projectId
        }).populate('assignedTeammates')
        if (!project) {
            req.flash('error', 'We could not find the project.')
            return res.redirect('/projects')
        }
        const team = project.assignedTeammates

        const headerText = "Create New Taks"
        const backBtnLink = `/projects/v/${projectId}`
        res.render('taskmanager/taskmanager', {
            project,
            team,
            headerText,
            backBtnLink
        })
    } catch (err) {
        console.log(err)
        return res.status(500).send('Internal Server Error')
    }
})


router.post('/taskmanager/:id', async (req, res) => {
    try {
        const projectId = req.params.id;
        if(!projectId){
            req.flash('error', 'Invalid Project ID')
            res.redirect('/projects')
        }
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

        req.flash('success', 'Task Created Succesfully')
        res.redirect(`/projects/v/${projectId}`)
    } catch (err) {
        console.log(err)
        res.status(500).send('Internal Server Error')
    }
})


router.get('/e/:projectId/tasks/edit/:taskId', async (req, res)=>{
    const projectId = req.params.projectId;
    if(!projectId){
        req.flash('error', 'Invalid Project ID')
        res.redirect('/projects')
    }
    const taskId = req.params.taskId;
    try{
        const project = await Project.findOne({_id: projectId})
            .populate('tasks.teammates')
            .populate('assignedTeammates')
            .populate('team');
        
        if(!project){
            req.flash('error', 'Project Does Not Exist')
            return res.redirect(`/projects/v/${projectId}`)
        }

        const task = project.tasks.id(taskId);

        if(!task){
            req.flash('error', 'Task not found.')
            return res.redirect(`/projects/v/${projectId}`)
        }
        const headerText = "Edit Task"
        const backBtnLink = `/projects/v/${projectId}`
        res.render('taskmanager/editTask', {
            project,
            task,
            allTeammates: project.assignedTeammates,
            headerText,
            backBtnLink
        })

    }catch(err){
        console.log(err);
        return res.status(500).send('Internal Server Error')
    }
})

router.post('/e/:projectId/tasks/edit/:taskid', async (req, res)=>{
    const projectId = req.params.projectId;
    if(!projectId){
        req.flash('error', 'Invalid Project ID')
        res.redirect('/projects')
    }
    const taskId = req.params.taskid;
    const { taskname, taskdescription, deadline, teammates } = req.body;
    try{
        const project = await Project.findOne({_id: projectId});
        if(!project){
            req.flash('error', 'Project Not found')
            return res.redirect(`/projects/v/${projectId}`)
        }

        const task = project.tasks.id(taskId);
        if(!task){
            req.flash('error', 'Task Not Found')
            return res.redirect(`/projects/v/${projectId}`)
        }
        task.taskname = taskname;
        task.taskdescription = taskdescription;
        task.deadlineDate = deadline;
        task.teammates = Array.isArray(teammates) ? teammates : [teammates];
    
        await project.save()

        req.flash('success', 'Task updated successfully!')
        return res.redirect(`/projects/v/${projectId}`)
    }catch(err){
        console.log(err);
        res.status(500).send('Internal Server Error')
    }
})


export default router;