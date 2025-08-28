# JettCRM

JettCRM is the tool for freelancers and agencies to keep track of their work, deadlines, invoices, meetings and all that technical stuff. The main goal is to organize everything at one place and make it easy for them to access and utilize it properly!


## Installation

* `git clone https://github.com/REGEX777/JettCRM.git`
* `cd JettCRM`
* `npm install`
* Create a `.env` (see **Environment**) and run  `node app.js`
* Visit `http://localhost:9000`.

## Dependencies

* Node.js (latest works)
* npm
* MongoDB
* (Optional) nodemon for development


## Suggested `.env` variables

Create a `.env` in the project root. 
```
MONGO_URI=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
BASE_URL=
STRIPE_KEY=
CGRADE_KEY=
RESEND_KEY=
```


## File Structure

```
app.js
config/
controllers/
middleware/
models/
routes/
views/        
public/       
utils/
```

