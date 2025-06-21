import express from 'express';
import { PDFInvoice } from '@h1dd3nsn1p3r/pdf-invoice';

// PDF generator
import { generateInvoicePDF } from '../../services/invoicePdf.js';

const router = express.Router();


router.post('/', async (req, res)=>{

  console.log(req.body)

	 const payload = {
    company: {
      name: req.body.companyName,
      address: req.body.companyAddress1,
      phone: req.body.companyPhone,
      email: "Mail: test",
      website: "Web: test",
      taxId: req.body.taxID, // Optional.
      bank: "IBAN: 1234567890AC", // Optional.
    },
    customer: {
      name: req.body.clientName,
      company: "test", // Optional.
      address: req.body.clientAddress1,
      phone: req.body.clientPhone,
      email: req.body.clientEmail,
      taxId: "tgest", // Optional.
    },
    invoice: {
      number: req.body.invoiceNumber, // String or number.
      date: req.body.sendDate, // Default is current date.
      dueDate: req.body.dueDate, // Default is current date.
      status: "test",
      locale: "es-ES", // BCP 47 language tag. Default is "en-US".
      currency: "EUR", // ISO 4217 currency code. Default is "USD".
      path: "./invoice.pdf", // Required. Path where you would like to generate the PDF file. 
    },
    items: [
      {
        name: "Cloud VPS Server - Starter Plan",
        quantity: 1,
        price: 400,
        tax: 0, // Specify tax in percentage. Default is 0.
      },
      {
        name: "Domain Registration - example.com",
        quantity: 1,
        price: 20,
        tax: 0, // Specify tax in percentage. Default is 0.
      },
      {
        name: "Maintenance Charge - Yearly",
        quantity: 1,
        price: 300,
        tax: 0, // Specify tax in percentage. Default is 0.
      },
    ],
    qr: {
      data: "https://www.festrolcorp.io",
      width: 100, // Default is 50.
    },
    note: {
      text: "Thank you for your business.",
      italic: false, // Default is true.
    }
  };
  const invoice = new PDFInvoice(payload);
	const pdf = await invoice.create();  

  console.log(pdf);
  res.send('eee')
})




export default router;