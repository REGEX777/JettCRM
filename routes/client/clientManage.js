import express, { json } from 'express';
import XLSX from  'xlsx';

const router = express.Router();

// middleware import
import upload from '../../middleware/multer.js';
import {isLoggedIn} from '../../middleware/isLoggedIn.js'

// model import
import Client from '../../models/Client.js';
import { last } from 'pdf-lib';
import clientIdGenerator from '../../middleware/clientIdGenerator.js';

const generateClientId = async (prefix = 'CL') => {
    const lastClient = await Client.findOne().sort({ ID: -1 });
    
    let nextNumber = 1;
    if (lastClient && lastClient.ID) {
        const matches = lastClient.ID.match(/\d+$/);
        if (matches) {
            nextNumber = parseInt(matches[0]) + 1;
        }
    }
    
    const paddedNumber = nextNumber.toString().padStart(2, '0');
    return `${prefix}-${paddedNumber}`;
};

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

router.get('/api', async (req, res) => {
    const search = req.query.search?.toLowerCase() || '';
    const filter = {
        $or: [
            { clientName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { businessName: { $regex: search, $options: 'i' } },
            { notes: { $regex: search, $options: 'i' } },
            { ID: { $regex: search.replace('#CL-', ''), $options: 'i' } },
            ...(isNaN(search) ? [] : [{ phoneNumber: parseInt(search) }])
        ]
    };

    const clients = await Client.find(filter).limit(50); 
    res.json(clients);
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

        const clientId = await clientIdGenerator.generateNextId();

        const newClient = new Client({
            ID: clientId,
            clientName,
            businessName,
            email,
            phoneNumber,
            address,
            website,
            notes,
            projects: 0,
            status: "Inactive",
            belongsTo: req.user._id
        });

        await newClient.save();

        req.flash('success', "Client Added Succesfully!")
        res.redirect('/clients/add')
    } catch (err) {
        console.error('Error saving client:', err);
        res.status(500).send('Server error');
    }
});

router.post('/upload-excel', upload.single('excel'), async (req, res) => {
    try {
        if (!req.file) {
            req.flash('error', 'No file uploaded');
            return res.redirect('/clients/add');
        }

        const fieldMappings = {
            clientName: ['clientname', 'name', 'client', 'company', 'organization'],
            email: ['email', 'emailaddress', 'e-mail'],
            businessName: ['businessname', 'business', 'companyname', 'organizationname'],
            phoneNumber: ['phonenumber', 'phone', 'telephone', 'mobile', 'contactnumber'],
            address: ['address', 'location', 'streetaddress'],
            website: ['website', 'url', 'web', 'site'],
            notes: ['notes', 'comments', 'remarks', 'description'],
            status: ['status', 'state', 'clientstatus'],
            projects: ['projects', 'projectcount', 'totalprojects'],
            belongsTo: req.user._id
        };

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (!Array.isArray(jsonData)) {
            req.flash('error', 'Excel file is empty or invalid format');
            return res.redirect('/clients/add');
        }

        const normalizeKey = (key = '') => key.toString().trim().toLowerCase().replace(/[\s_]+/g, '');

        const clientsToInsert = [];
        const skippedRows = [];
        const validationErrors = [];

        for (const [rowIndex, row] of jsonData.entries()) {
            const normalizedRow = {};
            
            for (const key in row) {
                normalizedRow[normalizeKey(key)] = row[key];
            }

            const client = {};
            let hasRequiredFields = false;

            for (const [field, possibleKeys] of Object.entries(fieldMappings)) {

                const foundKey = possibleKeys.find(key => normalizedRow[normalizeKey(key)] !== undefined);
                
                if (foundKey) {
                    client[field] = normalizedRow[normalizeKey(foundKey)];
                } else {
                    client[field] = '';
                }
            }

            if (client.projects) {
                client.projects = Number(client.projects) || 0;
            }

            if (!client.clientName) {
                validationErrors.push(`Row ${rowIndex + 2}: Missing client name`);
                continue;
            }

            if (!client.email) {
                validationErrors.push(`Row ${rowIndex + 2}: Missing email`);
                continue;
            }

            if (client.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)) {
                validationErrors.push(`Row ${rowIndex + 2}: Invalid email format (${client.email})`);
                continue;
            }

            clientsToInsert.push(client);
        }

        if (validationErrors.length > 0) {
            req.flash('error', `Validation errors: ${validationErrors.join('; ')}`);
            return res.redirect('/clients/add');
        }

        if (clientsToInsert.length === 0) {
            req.flash('error', 'No valid data found after processing all rows');
            return res.redirect('/clients/add');
        }


        //client id code
        let nextIdNumber = 1;
        const lastClient = await Client.findOne().sort({ID: -1});
        if(lastClient && lastClient.ID){
            const matches = lastClient.ID.match(/\d+$/);
            if(matches){
                nextIdNumber = parseInt(matches[0]) + 1;
            }
        }

        for (let i = 0; i < clientsToInsert.length; i++) {
            clientsToInsert[i].ID = `CL-${(nextIdNumber + i).toString().padStart(2, '0')}`;
        }



        const batchSize = 100;
        for (let i = 0; i < clientsToInsert.length; i += batchSize) {
            const batch = clientsToInsert.slice(i, i + batchSize);
            await Client.insertMany(batch);
        } 

        req.flash('success', `Successfully imported ${clientsToInsert.length} clients! ${skippedRows.length > 0 ? `${skippedRows.length} rows skipped.` : ''}`);
        res.redirect('/clients/add');

    } catch (err) {
        console.error('Upload error:', err);
        req.flash('error', err.message || 'Something went wrong during import');
        res.redirect('/clients/add');
    }
});

router.get('/export-excel',async (req, res)=>{
    try{
        const clients = await Client.find({belongsTo: req.user._id}).lean();

        if(!clients.length){
            return res.send("no data found")
        }

        const formatted = clients.map((c, i) => ({
            ID: `#CL-${String(i + 1).padStart(3, '0')}`,
            Name: c.clientName,
            Email: c.email,
            Phone: c.phoneNumber,
            Company: c.businessName,
            Projects: c.projects || '',
            Address: c.address || '',
            Website: c.website || '',
            Notes: c.notes || '',
        }));

        const ws = XLSX.utils.json_to_sheet(formatted);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Clients");


        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename="clients.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    }catch (err) {
        console.error(err);
        res.status(500).send('Failed to export clients');
    }
})


export default router;