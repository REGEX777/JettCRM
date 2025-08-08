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


router.get('/', async (req, res)=>{
    try{
        const estimates = await Estimate.find({user: req.user._id});
        const headerText = "EEEOOOO"
        res.render("estimate/estimates", {estimates, headerText})

    }catch(err){
        console.log(err)
        res.status(500).send('Internal Server Error')
    }
})


router.get('/create', (req, res)=>{
    try{
        const headerText = "Estimate Maker"
        const backBtnLink = "/"
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