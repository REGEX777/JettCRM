import express from 'express';

const router = express.Router();

// model import
import Client from '../../models/Client.js';

router.get('/', (req, res)=>{
    res.render('client_dash/clients')
})


router.get('/add', (req, res)=>{
    res.render('client_dash/add')
})

router.post('/add', async (req, res) => {
    try {
        const { clientName, businessName, email, phone, address, website, notes } = req.body;

        if (!clientName || !email) {
            return res.status(400).send('Client Name and Email are required.');
        }
        const phoneNumber = phone ? parseInt(phone.replace(/\D/g, '')) : undefined;

        const newClient = new Client({
            clientName,
            businessName,
            email,
            phoneNumber,
            address,
            website,
            notes
        });

        await newClient.save();

        res.send('Client added successfully')
    } catch (err) {
        console.error('Error saving client:', err);
        res.status(500).send('Server error');
    }
});

export default router;