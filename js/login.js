$(document).ready(function () {
    const $loginForm = $('form');

    if ($loginForm.length) {
        $loginForm.on('submit', function (e) {
            e.preventDefault();

            // Clear previous messages
            $('.bg-red-100, .bg-green-100').remove();

            // Collect data
            const formData = {
                username: $('input[name="username"]').val(),
                password: $('input[name="password"]').val()
            };

            $.ajax({
                url: CONFIG.apiUrl('/api/login'), // Use Configured API URL
                method: 'POST',
                data: JSON.stringify(formData),
                data: JSON.stringify(formData),
                contentType: 'application/json',
                headers: {
                    'Accept': 'application/json'
                },
                success: function (data) {
                    if (data.status === 'success' || data.token) {
                        // Store Bearer Token
                        if (data.token) {
                            localStorage.setItem('auth_token', data.token);
                        }

                        // Redirect
                        window.location.href = data.redirect || '/dashboard';
                    } else if (data.redirect) {
                        // Handle redirects for other statuses (e.g. unverified)
                        window.location.href = data.redirect;
                    } else {
                        showError(data.message || 'Login failed');
                    }
                },
                error: function (xhr) {
                    let msg = 'An error occurred';
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        msg = xhr.responseJSON.message;
                    }
                    showError(msg);
                }
            });
        });
    }

    function showError(message) {
        const $errorDiv = $('<div>')
            .addClass('bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm')
            .html(`<ul><li>${message}</li></ul>`);

        $('form').before($errorDiv);
    }
});
