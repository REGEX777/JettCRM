import express from 'express';


// model import
import mongoose from 'mongoose';
import Project from '../../models/Projects.js';

const router = express.Router();


router.get('/', (req, res)=>{
    res.render('project_dash/manageProjects')
})


router.get('/add', (req, res)=>{
    res.render('project_dash/addProjects')
})

router.post("/",async (req, res)=>{
    try{
        const{
            projectTitle,
            clientSelect,
            newClientEmail,
            startDate,
            deadline,
            priority,
            projectDescription,
            projectBudget,
            projectTeam,
            projectTags
        } = req.body;

        if(!projectTitle || typeof projectTitle != "string")
            return res.status(400).send("Invalid or missing Project Title")

        //fix this later dawg
        
        // if(!clientSelect || !mongoose.Types.ObjectId.isValid(clientSelect))
        //     return res.status(400).send("Invalid Client Id")

        if(newClientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newClientEmail))
            return res.status(400).send("Invalid client email")


        const parsedStartDate = new Date(startDate);
        const parsedDeadlineDate = new Date(deadline);

        if(isNaN(parsedStartDate) || isNaN(parsedDeadlineDate))
            return res.status(400).send("Invalid start or deadline date");

        if (!["low", "medium", "high"].includes(priority.toLowerCase()))
            return res.status(400).send("Priority must be low medium or high");

        const parsedBudget = parseFloat(projectBudget);

        if (isNaN(parsedBudget))
            return res.status(400).send("Invalid budget amount");

        const teamMembers = projectTeam
            ? String(projectTeam).split(",").map(id => id.trim()).filter(id => id)
            : [];

        const tags = projectTags
            ? String(projectTags).split(",").map(tag => tag.trim()).filter(tag => tag)
            : [];

        const project = new Project({
            title: projectTitle,
            //un comment this

            // clientId: clientSelect || "",
            clientEmail: newClientEmail || "",
            startDate: parsedStartDate,
            deadlineDate: parsedDeadlineDate,
            priority: priority.toLowerCase(),
            description: projectDescription || "",
            budget: parsedBudget,
            teamMembers: teamMembers,
            tags: tags,
            fileNames: []
        })

        await project.save();
        res.status(200).send("Project Created Succesfully")

    }catch(err){
        res.send(err)
        console.log(err)
    }
})


export default router;