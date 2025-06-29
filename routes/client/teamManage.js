import express from 'express';
import { Types } from 'mongoose';

// mongoose model
import Team from '../../models/Team.js';

const router = express.Router();


router.get('/',async (req, res)=>{
    try{
        // filter logic
        const {role, department} = req.query;


        const page = parseInt(req.query.page) || 1;
        const limit=4;

        const filter = {teamOwner: req.user._id}
        
        if (role && role !== 'all') {
        filter.role = role.toLowerCase();
        }

        if (department && department !== 'all') {
        filter.department = department.toLowerCase();
        }

        const totalTeamMembers = await Team.countDocuments(filter);
        const totalPages = Math.ceil(totalTeamMembers/limit);
        const skip = (page-1)*limit;

        const teamMembers = await Team.find(filter).skip(skip).limit(limit);

        res.render('team_dash/team', {
            teamMembers,
            currentPage: page,
            totalPages,
            totalTeamMembers,
            startEntry: skip + 1,
            endEntry: Math.min(skip+limit, totalTeamMembers)
        });
    }catch(err){
        console.log(err)
    }
})


router.get('/add', (req, res) => {
    res.render('team_dash/addTeam')
})

// API
router.get('/api', async (req, res)=>{
    const search = req.query.search?.toLowerCase() || '';
    const filter = {
        teamOwner: req.user._id, 
        $or: [
            { firstName: {$regex: search, $options:'i'}},
            { lastName: {$regex: search, $options:'i'}},
            { email: {$regex: search, $options:'i'}},
            { role: {$regex: search, $options:'i'}}
        ]
    };

    const teamMembers = await Team.find(filter).limit(50);
    res.json(teamMembers);
});

router.post('/api/update-status', async (req, res) => {
  const { id, status } = req.body;

  try {
    await Team.findByIdAndUpdate(id, { status });
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to update status:', err);
    res.status(500).json({ success: false, error: 'DB update failed' });
  }
});

router.post('/api/delete', async (req, res) => {
  try {
    const { id } = req.body;
    await Team.findByIdAndDelete(id);
    req.flash('success', "Succefully Deleted Member")
    res.redirect('/team')
  } catch (err) {
    console.error("Delete failed:", err);
    res.status(500).json({ success: false });
  }
});

router.get('/edit/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).send("Bad Request");
    }

    const member = await Team.findById(id);
    if (!member) {
      return res.status(404).send('Not Found!');
    }

    res.render('team_dash/edit', { member });

  } catch (err) {
    console.error('Edit route error:', err);
    res.status(503).send('Internal Server Error');
  }
});


router.post('/edit/:id', async (req, res) => {
    const id = req.params.id;
    if (!Types.ObjectId.isValid(id)) {
        return res.status(400).send('Invalid ID');
    }

    try{
        const updatedData = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            phone: req.body.phone,
            role: req.body.role,
            department: req.body.department,
            joinDate: req.body.joinDate,
            salary: req.body.salary,
            status: req.body.status,
        }

        const result = await Team.findByIdAndUpdate(id, updatedData, {new:true}) 
        if(!result) return res.status(404).send('Member Not Found')
        req.flash('success', 'Succesfully Updated User')
        res.redirect(`/team/edit/${id}`)
    } catch(err){
        console.log(err);
        res.status(500).send('Internal Server Error');
    }

});

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

        const emailUser = await Team.findOne({email: email});
        if(emailUser){
            req.flash('error', "Email is already in use.")
            return res.redirect('/team/add')
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
            status: "Active",
            teamOwner: req.user._id
        });

        await newTeamMember.save();
        req.flash('success','Team member added successfully.')
        res.redirect('/team/add')
    } catch (error) {
        console.error("Error saving team member:", error);
        res.status(500).send("Internal Server Error.");
    }
})

export default router;