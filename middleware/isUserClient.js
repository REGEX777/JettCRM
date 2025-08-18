
export function checkClient(req, res, next) {
  try {
    const user = req.user;
    
    
    // admins are god
    if (user.admin) return next();

    
    const clientArray = Array.isArray(user.clientOf) ? user.clientOf : [];
    
    const hasClient = clientArray.filter(Boolean).length > 0;

    if (hasClient) return next();

    // if no client redirect to the home page
    return res.redirect('/');
  } catch (err) {
    console.error('checkClient middleware error:', err);
    return res.redirect('/');
  }
}
