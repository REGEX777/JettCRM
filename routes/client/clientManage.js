import express, { json } from 'express';
import XLSX from  'xlsx';

const router = express.Router();

// middleware import
import upload from '../../middleware/multer.js';

// model import
import Client from '../../models/Client.js';


router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;  
        const totalClients = await Client.countDocuments();
        const totalPages = Math.ceil(totalClients / limit);
        const skip = (page - 1) * limit;

        const clients = await Client.find().skip(skip).limit(limit);

        res.render('client_dash/clients', {
            clients,
            currentPage: page,
            totalPages,
            totalClients,
            startEntry: skip + 1,
            endEntry: Math.min(skip + limit, totalClients)
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Internal Server Error');
    }
});


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
            notes,
            projects: 0,
            status: "Inactive"
        });

        await newClient.save();

        req.flash('success', "Client Added Succesfully!")
        res.redirect('/clients/add')
    } catch (err) {
        console.error('Error saving client:', err);
        res.status(500).send('Server error');
    }
});

router.post('/upload-excel', upload.single('excel'), async(req, res)=>{
    try{
        if(!req.file) return res.status(400).send('No File Uploaded');

        const workbook = XLSX.read(req.file.buffer, {type: 'buffer'});
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if(!Array.isArray(jsonData) || jsonData.length === 0){
            return res.send('Excel File Empty')
        }

        const clientsToInsert = [];

        for (const row of jsonData){
            const client = {
                clientName: row.clientName || row["Client Name"],
                email: row.email || row["Email"],
                businessName: row.businessName || row["Business Name"],
                phoneNumber: row.phoneNumber || row["Phone Number"],
                address: row.address || row["Address"],
                website: row.website || row["Website"],
                notes: row.notes || row["Notes"],
                status: row.status || row["Status"],
                projects: Number(row.projects || row["Projects"]) || 0
            };

            if (client.clientName && client.email) {
                clientsToInsert.push(client);
            }
        }

        if(clientsToInsert.length === 0){
            return res.send("No valid data found")
        }

        await Client.insertMany(clientsToInsert);

        req.flash('success', "Document Inserted Succefully!")
        res.redirect('/clients/add')
    }catch(err){
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Something went wrong.' });
    }
})



export default router;