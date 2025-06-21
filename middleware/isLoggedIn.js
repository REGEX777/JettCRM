export function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next()
    }
    res.redirect('/login')
}

// to check if people are logged in or not, will update this when i implement the email verification