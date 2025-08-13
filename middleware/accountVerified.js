export const isVerified = (req, res, next)=>{
    if (!req.user.verified) {
        console.log(req.user.verified)
        return res.render('extra/verifyEmail');
    }

    next();
}

