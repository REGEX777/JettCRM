export function checkPm(){
    try{
        const user = req.user;
        if (user.admin) return next();

        const pmArray = Array.isArray(user.teamOwnerOf) ? user.teamOwnerOf : [];

        const isPm = pmArray.filter(Boolean).length > 0;

        if (isPm) return next();

        return res.redirect('/');
    }catch(err){
        console.error('PMCheck middleware error:', err);
        return res.redirect('/');
    }
}