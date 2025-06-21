export function isLoggedOut(req, res, next){
    if(!req.isAuthenticated()){
        return next();
    }

    res.redirect('/')
}

// this will resitric people from tryiing to log in if they are already logged in