export function storeOriginalUrl(req, res, next) {
    const skipUrls = [
        '/login', '/logout', '/register', '/',
        '/auth/login', '/auth/register', '/oauth2/google', '/oauth2/google/callback'
    ];

    if (
        req.method === 'GET' &&
        !req.isAuthenticated?.() &&
        !skipUrls.includes(req.path) &&
        !req.session.redUrl // Dont nuke my routes i beg u please
    ) {
        console.log('[storeOriginalUrl] storing:', req.originalUrl);
        console.log('[storeOriginalUrl] session:', req.session);
        console.log('req.session:', req.session);
        req.session.redUrl = req.originalUrl;
    }

    next();
}