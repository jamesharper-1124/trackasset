/* Guest Guard - Redirects authenticated users to dashboard */
(function () {
    const token = localStorage.getItem('auth_token');
    if (token) {
        // Optional: Verify token validity via API? 
        // For speed, we trust the existence of the token implies a session.
        // If the token is invalid, the dashboard's auth-guard will catch it and redirect back to login.

        // Prevent infinite loop if we are already on dashboard (though this script shouldn't be included there)
        if (!window.location.pathname.includes('/dashboard')) {
            window.location.href = '/dashboard';
        }
    }
})();
