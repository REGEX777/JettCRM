import 'dotenv/config'
import express from 'express';
import mongoose from 'mongoose';
import passport from 'passport';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import passportConfig from './config/passport.js'
import flash from 'connect-flash';

// Middleware Imports
import { storeOriginalUrl } from './middleware/saveOriginalURL.js';


mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("[+] Database Connected Succesfully");
    })
    .catch(err => console.log(err));




const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(cookieParser());
app.use(express.urlencoded({
    extended: true
}))

app.use(session({
    secret: 'supersecretkey',
    resave: false,
    saveUninitialized: false
}))
app.use(storeOriginalUrl)

passportConfig(passport);
app.use(passport.initialize());
app.use(passport.session());

app.use(flash())

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

const port = 9000;

// CLient route imports
import dashRoute from './routes/client/dash.js'
import invoiceRoute from './routes/client/invoicegen.js'
import settingsRoute from './routes/client/settings.js'
import signupRoute from './routes/client/signup.js'
import loginRoute from './routes/client/login.js'

// Backend Routes (API) Imports
// import invoiceBack from './routes/backend/invoiceBack.js'
import signupBack from './routes/backend/signupBack.js'
import loginBack from './routes/backend/loginBack.js'
import logOutRoute from './routes/backend/logout.js'
import googleOauth2 from './routes/backend/oauth2/google.js'

// Client Route
app.use('/', dashRoute);
app.use('/geninvoice', invoiceRoute);
app.use('/settings', settingsRoute);
app.use('/signup', signupRoute)
app.use('/login', loginRoute)

// Backend Route
// app.use('/services/invoice', invoiceBack)
app.use('/auth/signup', signupBack)
app.use('/auth/login', loginBack)
app.use('/logout', logOutRoute)
app.use('/oauth2/', googleOauth2)

app.listen(port, ()=>{
    console.log(`[+] Server Started On Port ${port}`)
})