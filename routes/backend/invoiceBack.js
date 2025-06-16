import express from 'express';

// PDF generator
import { generateInvoicePDF } from '../../services/invoicePdf.js';

const router = express.Router();


router.post('/', async (req, res)=>{
  const pdfBytes = await generateInvoicePDF(req.body);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="invoice-${req.body.invoiceNumber}.pdf"`
  });

  res.send(pdfBytes);
})

export default router;