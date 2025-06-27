import express from 'express';

// mongoose model
import Team from '../../models/Team.js';

const router = express.Router();


router.get('/add', (req, res) => {
    res.render('team_dash/addTeam')
})


router.post('/add', async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            role,
            department,
            age,
            joinDate,
            salary,
            notes,
        } = req.body;

        if (
            !firstName ||
            !lastName ||
            !email ||
            !role ||
            !department ||
            !joinDate
        ) {
            return res.status(400).send("Missing required fields.");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).send("Invalid email format.");
        }

        const newTeamMember = new Team({
            firstName,
            lastName,
            email,
            phone: phone ? parseInt(phone) : undefined,
            role,
            department,
            age: age ? parseInt(age) : undefined,
            joinDate,
            salary,
            notes,
        });

        await newTeamMember.save();
        res.status(201).send("Team member added successfully.");
    } catch (error) {
        console.error("Error saving team member:", error);
        res.status(500).send("Internal Server Error.");
    }
})

export default router;