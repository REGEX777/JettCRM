export function storeOriginalUrl(req, res, next) {
    const skipUrls = ['/login', '/logout', '/register', '/auth/login', '/auth/register'];
    if (!req.isAuthenticated?.() && !skipUrls.includes(req.path)) {
        res.cookie('redUrl', req.originalUrl, { httpOnly: true });
    }
    next();
}