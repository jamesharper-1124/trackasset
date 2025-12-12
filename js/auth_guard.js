(function () {
    const token = localStorage.getItem('auth_token');

    // 1. Check if token exists locally
    if (!token) {
        console.warn('Auth Token missing. Redirecting...');
        window.location.href = '/login?error=session_expired';
        return;
    }

    // 2. Validate token against the server
    // We use a robust check. If this takes too long, we might show a spinner, 
    // but for now we let it run. If it fails, we redirect.
    fetch('/api/user', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Accept': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                // 401 Unauthorized or 403 Forbidden
                throw new Error('Token invalid or expired');
            }
            // Token is valid, do nothing.
        })
        .catch(error => {
            console.error('Session validation failed:', error);
            localStorage.removeItem('auth_token'); // Clear invalid token
            window.location.href = '/login?error=session_expired';
        });
})();
