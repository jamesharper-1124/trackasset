// 0. Global State for Session Alert
window.hasAlertedSession = false;

// 1. Immediate Global AJAX Setup (Dynamic Token Injection)
$.ajaxSetup({
    beforeSend: function (xhr) {
        const token = localStorage.getItem('auth_token');
        if (token) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        }
        xhr.setRequestHeader('Accept', 'application/json');
    }
});

// 2a. Global Success Interceptor (Catches Redirects to Login Page)
$(document).ajaxSuccess(function (event, xhr, settings) {
    if (xhr.getResponseHeader('Content-Type') && xhr.getResponseHeader('Content-Type').indexOf('text/html') !== -1) {
        // If we expect JSON but got HTML, it's likely a redirect to login.
        if (settings.dataType === 'json' || (settings.headers && settings.headers.Accept === 'application/json')) {
            console.warn('Received HTML response for JSON request. Likely uncaught redirect to login.');

            if (!window.hasAlertedSession) {
                window.hasAlertedSession = true;
                alert('Session Expired. Please log in again.');
                localStorage.removeItem('auth_token');
                window.location.href = 'login.html';
            }
        }
    }
});

// 2b. Global Error Interceptor (Defined IMMEDIATELY to catch early requests)
$(document).ajaxError(function (event, jqxhr, settings, thrownError) {
    if (jqxhr.status === 401) {
        // Prevent multiple alerts if multiple requests fail at once
        if (!window.hasAlertedSession) {
            window.hasAlertedSession = true;
            alert('Session Expired. Please log in again.');

            // Clear token and redirect
            localStorage.removeItem('auth_token');
            window.location.href = 'login.html';
        }
    }
});

// 3. Immediate Token Check + Validation (Runs before DOM Ready)
(function () {
    // Current Page Check: Adjust regex for .html files
    const isPublicPage = window.location.pathname.match(/(login\.html|register\.html|verify_account\.html|forgot-password\.html|reset-password\.html)$/);
    const token = localStorage.getItem('auth_token');

    if (!token && !isPublicPage) {
        window.stop();
        // alert('Session Expired. Please log in again.'); // Optional: too annoying on load
        window.location.href = 'login.html?error=session_expired';
    } else if (token && !isPublicPage) {
        // Validate Token with Server
        $.ajax({
            url: CONFIG.apiUrl('/api/user'), // USE CONFIG!
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (user) {
                // Token is valid.
                console.log('Token validated:', user);

                // Update Header User Name
                const nameDisplay = document.getElementById('user-name-display');
                if (nameDisplay && user.firstname) {
                    nameDisplay.textContent = user.firstname;
                }

                // Update User Role/Admin Links
                if (user && user.role === 'admin') {
                    // Show admin links if hidden
                    const navUsers = document.getElementById('nav-users');
                    if (navUsers) navUsers.style.display = 'flex'; // Use flex to match .nav-link style
                }
            },
            error: function (xhr) {
                // 401 is now handled by the global ajaxError handler defined above.
                if (xhr.status !== 401) {
                    console.warn('Token validation failed strictly (non-401).', xhr);
                }
            }
        });
    }
})();


$(document).ready(function () {

    // 4. Authenticated Logout via jQuery
    $('#logout-btn').on('click', function (e) {
        e.preventDefault();

        $.ajax({
            url: CONFIG.apiUrl('/api/logout'), // USE CONFIG!
            method: 'POST',
            success: function () {
                localStorage.removeItem('auth_token');
                window.location.href = 'login.html';
            },
            error: function () {
                // Force logout even if API fails
                localStorage.removeItem('auth_token');
                window.location.href = 'login.html';
            }
        });
    });

    // 5. Pre-Navigation Token Check (Intercepts all links)
    $(document).on('click', 'a', function (e) {
        const href = $(this).attr('href');

        // Skip if:
        // 1. No href or empty
        // 2. Starts with # (internal anchor)
        // 3. Is a javascript: link
        // 4. Target is _blank (new tab)
        // 5. User is already on public page (login/register) - allowing navigation between them

        if (!href || href === '#' || href.startsWith('#') || href.startsWith('javascript:')) return;
        if ($(this).attr('target') === '_blank') return;

        const isPublicNav = href.includes('login') || href.includes('register') || href.includes('verify');
        if (isPublicNav) return;

        const token = localStorage.getItem('auth_token');
        if (!token) {
            console.log('Pre-navigation check: Token missing. Redirecting to login.');
            e.preventDefault();
            window.location.href = 'login.html?error=no_token';
        }
    });

});
