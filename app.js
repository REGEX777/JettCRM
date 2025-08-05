import 'dotenv/config'
import express from 'express';
import mongoose from 'mongoose';
import passport from 'passport';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import passportConfig from './config/passport.js'
import flash from 'connect-flash';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Middleware Imports
import { storeOriginalUrl } from './middleware/saveOriginalURL.js';
import { isLoggedIn } from './middleware/isLoggedIn.js';

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("[+] Database Connected Succesfully");
    })
    .catch(err => console.log(err));
 
const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}))

app.use(session({
    secret: process.env.CGRADE_KEY,
    resave: false,
    saveUninitialized: false
}))

passportConfig(passport);
app.use(passport.initialize());
app.use(passport.session());

app.use(flash())

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.use((req, res, next) => {
  res.locals.user = req.user || null; 
  next();
});


app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url} | Authenticated: ${req.isAuthenticated?.()}`);
  next();
});



const port = 9000;

// CLient route imports
import dashRoute from './routes/client/dash.js'
import invoiceRoute from './routes/client/invoicegen.js'
import settingsRoute from './routes/client/settings.js'
import signupRoute from './routes/client/signup.js'
import loginRoute from './routes/client/login.js' 
import projectManageRoute from './routes/client/manageProjects.js' 
import inviteRoute from './routes/client/invite.js'
import loungeRoute from './routes/client/entry.js'
import teamRoute from './routes/client/team.js'
import clientRoute from './routes/client/clientele.js'
import teamdashRoute from './routes/client/teamDash.js'
import taskRoute from './routes/client/tasks.js'
import estimateRoute from './routes/client/estimate.js'

// Backend Routes (API) Imports
// import invoiceBack from './routes/backend/invoiceBack.js'
import signupBack from './routes/backend/signupBack.js'
import loginBack from './routes/backend/loginBack.js'
import logOutRoute from './routes/backend/logout.js'
import googleOauth2 from './routes/backend/oauth2/google.js'

// misc routes import
import meetingsRoute from './routes/misc/calendar.js'

import onboardROute from './routes/misc/onboard.js'

// api routes
import emailRoute from './routes/api/email.js'

// public
app.use('/signup', signupRoute);
app.use('/login', loginRoute);
app.use('/invite', storeOriginalUrl, inviteRoute);
app.use('/entry', loungeRoute);

// login signup auth
app.use('/logout', logOutRoute);
app.use('/auth/signup', signupBack);
app.use('/auth/login', loginBack);
app.use('/oauth2/', googleOauth2);

// secure routes
app.use('/geninvoice', isLoggedIn, invoiceRoute);
app.use('/settings', storeOriginalUrl, isLoggedIn, settingsRoute);
app.use('/projects', storeOriginalUrl, isLoggedIn, projectManageRoute);
app.use('/team', storeOriginalUrl, isLoggedIn, teamRoute);
app.use('/client', storeOriginalUrl, isLoggedIn, clientRoute);
app.use('/myteam', storeOriginalUrl, isLoggedIn, teamdashRoute);
app.use('/mytasks', storeOriginalUrl, isLoggedIn, taskRoute);
app.use('/stripe', storeOriginalUrl, isLoggedIn, onboardROute);
// app.use('/calendar', storeOriginalUrl, isLoggedIn, meetingsRoute);
app.use('/tools/estimate', storeOriginalUrl, isLoggedIn, estimateRoute);

// bzzzzzzzzzz static file
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// never gonna give u up
app.use('/', storeOriginalUrl, isLoggedIn, dashRoute);


// api

app.use('/email', emailRoute)


app.listen(port, ()=>{
    console.log(`[+] Server Started On Port ${port}`)
})