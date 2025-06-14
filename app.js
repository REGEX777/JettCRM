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

app.use('/', dashRoute);

app.listen(port, ()=>{
    console.log(`[+] Server Started On Port ${port}`)
})