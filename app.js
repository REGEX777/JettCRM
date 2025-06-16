import express from 'express';


const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({
    extended: true
}))
const port = 9000;

// CLient route imports
import dashRoute from './routes/client/dash.js'
import invoiceRoute from './routes/client/invoicegen.js'

// Backend Routes (API) Imports
import invoiceBack from './routes/backend/invoiceBack.js'

// Client Route
app.use('/', dashRoute);
app.use('/geninvoice', invoiceRoute)

// Backend Route
app.use('/services/invoice', invoiceBack)

app.listen(port, ()=>{
    console.log(`[+] Server Started On Port ${port}`)
})