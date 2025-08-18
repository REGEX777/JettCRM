import express from 'express';
import PDFDocument from 'pdfkit';


// model import
import Estimate from '../../models/Estimate.js';
import User from '../../models/User.js'


const router = express.Router();

router.get('/v/:id', async (req, res)=>{
    try{
        const estimateId = req.params.id;

        if(!estimateId){
            req.flash('error','Invalid Request')
            res.redirect('/tools/estimates')
        }

        const estimate = await Estimate.findOne({_id: estimateId}).populate('user').populate('client');
        if(!req.user._id.equals(estimate.user._id)){
            req.flash('error', 'Unauthorized')
            return res.redirect('/tools/estimate')
        }

        const headerText = "eee"
        const backBtnLink = "/tools/estimate"
        res.render('estimate/estimateView', {estimate, headerText, backBtnLink})
        
    }catch(err){
        console.log(err);
        res.status(500).send('Internal Server Error')
    }
})


router.get('/edit/:id', async (req, res)=>{
    try {
        const id = req.params.id;
        
        const estimate = await Estimate.findOne({_id: id}).populate('user');

        if(!estimate){
            req.flash('error', 'Not Found')
            return res.redirect('/tools/estimate')
        }


        if(!estimate.user._id.equals(req.user._id)){
            req.flash('error', 'Unauthorized')
            res.redirect('/tools/estimate')
        }

        const headerText = "eee"
        const backBtnLink = "/tools/estimate"
        res.render('estimate/editEstimate', {estimate, headerText, backBtnLink})
    } catch (error) {
        console.log(error)
        res.status(500).send('Internal Server Error')
    }
})


router.post('/edit/:id', async (req, res)=>{
    const {items, tax, discount, discountType, notes, clientEmail, clientName, clientAddress} = req.body;

    try{
        if(!items || !Array.isArray(items) || items.length === 0 || !clientEmail){
            req.flash('error', 'Insufficient data provided');
            return res.redirect(`/tools/estimate/edit/${req.params.id}`);
        }

        const parsedItems = items.map(item => ({
            name: item.name,
            price: Number(item.price) || 0
        }));

        const originalTotal = parsedItems.reduce((acc, item) => acc + item.price, 0);

        let discountValue = 0;
        if (discountType === 'flat') {
            discountValue = Number(discount) || 0;
        } else if (discountType === 'percent') {
            discountValue = (originalTotal * (Number(discount) || 0)) / 100;
        }
        const totalAfterDiscount = originalTotal - discountValue;

        const existingClient = await User.findOne({ email: clientEmail });

        await Estimate.findByIdAndUpdate(req.params.id, {
            items: parsedItems,
            tax: Number(tax) || 0,
            discount: Number(discount) || 0,
            discountType,
            notes,
            originalTotal,
            totalAfterDiscount,
            client: existingClient ? existingClient._id : undefined,
            clientEmail,
            clientAddress,
            clientName
        });

        req.flash('success', 'Estimate updated successfully!');
        res.redirect(`/tools/estimate/edit/${req.params.id}`);
    }catch(err){
        console.log(err)
        res.status(500).send('Internal Server Error')
    }
})


router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Current page
        const limit = 5; // Items per page
        const skip = (page - 1) * limit;

        // Get total number of estimates for this user
        const totalCount = await Estimate.countDocuments({ user: req.user._id });

        // Get paginated estimates
        const estimates = await Estimate.find({ user: req.user._id })
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }); // newest first

        const headerText = "Create an estimate";
        const backBtnLink = "/dashboard"

        res.render("estimate/estimates", {
            estimates,
            headerText,
            backBtnLink,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            extraQuery: "" // You can pass filters here like `status=Draft`
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});


router.get('/create', (req, res)=>{
    try{
        const headerText = "Estimate Maker"
        const backBtnLink = "/dashboard"
        res.render('estimate/createEstimate', {headerText, backBtnLink})
    }catch(err){
        console.log(err);
        res.status(500).send('Internal Server Error')
    }
})

router.post('/create',async (req, res)=>{
    const { items, tax, discount, discountType, notes, clientEmail, clientName, clientAddress } = req.body;
    
    try {

        if (
            !Array.isArray(items) ||
            items.length === 0 ||
            items.some(item => !item.name || isNaN(item.price))
        ) {
            req.flash('error', 'Atleast one items is required');
            return res.redirect('/tools/estimate/create');
        }

        if (!clientEmail || typeof clientEmail !== 'string' || !clientEmail.trim()) {
            req.flash('error', 'Client email is required');
            return res.redirect('/tools/estimate/create');
        }
        const parsedItems = items.map(item => ({
            name: item.name,
            price: Number(item.price)
        }));

        const originalTotal = parsedItems.reduce((acc, item) => acc + item.price, 0);

        let discountValue = 0;

        if (discountType === 'flat') {
            discountValue = Number(discount);
        } else if (discountType === 'percent') {
            discountValue = (originalTotal * Number(discount)) / 100;
        }

        const totalAfterDiscount = originalTotal - discountValue;
        
        const existingClient = await User.findOne({ email: clientEmail });


        const newEstimate = new Estimate({
            items: items.map(item => ({
                name: item.name,
                price: Number(item.price)
            })),
            tax: Number(tax),
            discount: Number(discount),
            discountType,
            notes,
            user: req.user._id,
        
            originalTotal,
            totalAfterDiscount,

            // client info
            client: existingClient ? existingClient._id : undefined,
            clientEmail,
            clientAddress,
            clientName
        })

        newEstimate.save();
        req.flash('success', 'Estimate Created Succesfully')
        res.redirect('/tools/estimate')
    } catch (error) {
        console.log(error)
        res.status(500).send('Internal Server Error')
    }
})


// api for searchinggg

function escapeRegex(text = '') {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


router.get('/api', async (req, res) => {
  try {
    const { search = '', status, dateRange, dateFrom, dateTo } = req.query;

    
    const query = {};

    if (status && status !== 'All') query.status = new RegExp(`^${escapeRegex(status)}$`, 'i');



    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      if (dateRange === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const end = new Date(start); end.setDate(end.getDate() + 1);
        query.createdAt = { $gte: start, $lt: end };
      } else if (dateRange === 'week') {
        const start = new Date(); start.setDate(now.getDate() - 7);

        query.createdAt = { $gte: start };
      } else if (dateRange === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        
        query.createdAt = { $gte: start };
      } else if (dateRange === 'custom' && (dateFrom || dateTo)) {
        query.createdAt = {};
        
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
      }
    }

    // find estimates lesgoo
    let estimates = await Estimate.find({...query, user: req.user._id}) // fart phusshhhh
      .populate('client')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    // ai helped me write the regex code 🙏 ts is way too hard im sorry
    if (search && search.trim() !== '') {
      const q = search.trim().replace(/\s+/g, ' ');
      const regex = new RegExp(escapeRegex(q), 'i');

      estimates = estimates.filter(e => {
        if (regex.test(String(e._id || ''))) return true;

        if (Array.isArray(e.items) && e.items.some(it => it.name && regex.test(String(it.name)))) return true;

        if (e.client && typeof e.client === 'object') {
          const first = (e.client.firstName || '').trim();

          const last = (e.client.lastName || '').trim();
          const fullName = [first, last].filter(Boolean).join(' ').replace(/\s+/g, ' ');
          if (fullName && regex.test(fullName)){
             return true;
          }
          if (first && regex.test(first)){ 
            return true;
          }
          if (last && regex.test(last)) {
            return true;
          }
          if (e.client.email && regex.test(String(e.client.email))){
            return true;
          }
        } else {
          if (e.clientName && regex.test(String(e.clientName))){
            return true;
          }
          if (e.clientEmail && regex.test(String(e.clientEmail))){
            return true;
          }
        }

        return false;
      });
    }

    

    // final
    const results = estimates.map(e => {
      const subtotal = (e.items || []).reduce((s, it) => s + (Number(it.price) || 0), 0);


      const discountAmount = e.discountType === 'flat' ? (Number(e.discount) || 0) : (subtotal * (Number(e.discount) || 0) / 100);

      const total = (subtotal - discountAmount) * (1 + (Number(e.tax) || 0) / 100);

      return {
        id: e._id,
        clientName: e.client
        ? ([e.client.firstName, e.client.lastName]
            .filter(Boolean) 
            .map(name => name.trim())
            .join(' ') || e.clientName || '-')
        : (e.clientName || '-'),
        clientEmail: e.client ? (e.client.email || e.clientEmail) : (e.clientEmail || '-'),
        createdAt: e.createdAt,

        status: e.status || 'Draft',
        total: Number(total || 0)
      };
    });

    res.json(results);
  } catch (err) {
    console.error('Estimate API error', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// pdf routee
router.get('/:id/pdf', async (req, res)=>{
    try {


        const estimate = await Estimate.findById(req.params.id).populate('client').populate('user');
        const user = req.user;
        if(!estimate){
            req.flash('error', 'Not Found')
            return res.redirect('/tools/estimate')
        }


        res.setHeader("Content-Type", "application/pdf")
        res.setHeader(
            "Content-Disposition",
            `attachement; filename=estimate-${estimate._id}.pdf`
        )

        const doc = new PDFDocument({margin:40});

        
        const headerHeight = 60;
        const headerColor = '#1E1E1E';
        const logoSize = 20;

        doc.rect(0, 0, doc.page.width, headerHeight).fill(headerColor);

        const logoMargingLeft = 40;
        const logoMargininTop = (headerHeight - logoSize) / 2;

        doc.image('public/default/logo.png', logoMargingLeft, logoMargininTop, { height: logoSize })

        doc.fillColor('black');

        doc.moveDown(3)


        doc.pipe(res);

        doc.fontSize(20).font('Helvetica-Bold').text(user.businessName ? user.businessName : "-" , {align: "left", width: 300})
        doc.fontSize(10).font('Helvetica-Bold').fillColor("#555").text(user.businessAddress ? user.businessAddress : "-" , { align: "left" })
        doc.fontSize(10).font('Helvetica-Bold').fillColor("#555").text(user.businessEmail ? user.businessEmail : "-" , { align: "left" })

        doc.moveUp(3).fontSize(10).fillColor('#000').text(`Estimate #${estimate._id.toString().slice(-6).toUpperCase()}`, { align: "right" });
        doc.text(`Date: ${new Date(estimate.createdAt).toLocaleDateString()}`, { align: "right" });

        doc.moveDown(4);

        doc.fontSize(14).font("Helvetica-Bold").text("Client Information", { underline: true });
        doc.fontSize(10).font("Helvetica").fillColor("#000").text(estimate.clientName || "-").text(estimate.clientEmail || "-").text(estimate.clientEstimate || "-");
        doc.moveDown();

        const pageWidth = doc.page.width;
        const rightMargin = doc.options.margin;

        const priceWidht = 100;
        
        const priceCol = pageWidth - rightMargin - priceWidht;

        const tableTop = doc.y + 10;
        const itemCol = doc.options.margin;
        const tableRightEdge = pageWidth - rightMargin;

        // header section

        doc.font("Helvetica-Bold").fontSize(10);
        doc.text("Item", itemCol, tableTop);
        doc.text("Price", priceCol, tableTop, { width: priceWidht, align: "right" });

        doc.moveTo(itemCol, tableTop + 15).lineTo(tableRightEdge, tableTop + 15).stroke();

        let y = tableTop + 25;
        doc.font("Helvetica").fontSize(10);

        estimate.items.forEach((item) => {
            doc.text(item.name, itemCol, y, { width: priceCol - itemCol - 10 });
            doc.text(`$${item.price.toFixed(2)}`, priceCol, y, { width: priceWidht , align: "right" });
            y += 20;
        });

        doc.moveTo(itemCol, y).lineTo(tableRightEdge, y).stroke();

        // totaling

        const subtotal = estimate.items.reduce((sum, item) => sum + item.price, 0);
        const discountVal = estimate.discountType === "flat"
            ? estimate.discount
            : (subtotal * estimate.discount) / 100;
        const taxVal = ((subtotal - discountVal) * estimate.tax) / 100;
        const total = subtotal - discountVal + taxVal;

        y += 10;
        const labelX = priceCol - 90;
        const valueX = priceCol;

        doc.font("Helvetica").fontSize(10);
        doc.text("Subtotal:", labelX, y);
        doc.text(`$${subtotal.toFixed(2)}`, valueX, y, {width: priceWidht, align: "right" });

        if (estimate.discount > 0) {
            y += 15;
            doc.text(
                `Discount (${estimate.discountType === "flat" ? `$${estimate.discount}` : estimate.discount + "%"})`,
                labelX, y
            );
            doc.text(`-$${discountVal.toFixed(2)}`, valueX, y, { width: priceWidht, align: "right" });
        }

        y += 15;
        doc.text(`Tax (${estimate.tax}%)`, labelX, y);
        doc.text(`$${taxVal.toFixed(2)}`, valueX, y, {  width: priceWidht, align: "right" });

        y += 15;
        doc.font("Helvetica-Bold").text("Total:", labelX, y);
        doc.text(`$${total.toFixed(2)}`, valueX, y, {  width: priceWidht, align: "right" });

        if (estimate.notes) {
            y += 40;

            const notesX = 50; 
            doc.font("Helvetica-Bold")
            .fontSize(12)
            .text("Notes", notesX, y);

            y += 25; // spaces bellow notes text
            doc.font("Helvetica")
            .fontSize(10)
            .text(estimate.notes, notesX, y, { width: 300 });
        }

        doc.end();
    } catch (error) {
        console.log(error)
        res.status(500).send('Internal Server Error')
    }
})

export default router;