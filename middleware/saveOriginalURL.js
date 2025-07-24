export function storeOriginalUrl(req, res, next) {
    if (!req.isAuthenticated()) {
        res.cookie('redUrl', req.originalUrl); // use originalUrl instead of req.url
    }
    next();
}