$(document).ready(function () {
    console.log('Profile Settings Script Loaded');

    const form = $('form[action*="settings"]');

    if (form.length > 0) {
        form.on('submit', function (e) {
            e.preventDefault();
            console.log('Profile Settings submission intercepted');

            const token = localStorage.getItem('auth_token');
            if (!token) {
                alert('Authentication token missing. Please login again.');
                window.location.href = '/login';
                return;
            }

            const formData = new FormData(this);

            // Ensure PUT method spoofing is present if it's not already
            if (!formData.has('_method')) {
                formData.append('_method', 'PUT');
            }

            // Log data for debugging
            for (var pair of formData.entries()) {
                console.log(pair[0] + ', ' + pair[1]);
            }

            // Use the form's action attribute as the URL (e.g. /api/settings)
            // Ensure your route('settings.update') returns the API route URL
            const submitUrl = $(this).attr('action');

            $.ajax({
                url: submitUrl,
                type: 'POST', // POST with _method: PUT
                data: formData,
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Accept': 'application/json'
                },
                processData: false,
                contentType: false,
                success: function (response) {
                    console.log('Update success:', response);
                    if (response.redirect) {
                        alert(response.message || 'Profile updated successfully');
                        window.location.href = response.redirect;
                    } else {
                        alert(response.message || 'Profile updated successfully');
                        // Reload page or redirect to dashboard if no redirect provided
                        window.location.href = '/dashboard';
                    }
                },
                error: function (xhr) {
                    console.error('Update error:', xhr);
                    let errorMsg = 'An error occurred during the update.';

                    if (xhr.status === 401) {
                        errorMsg = 'Session expired. Please login again.';
                        window.location.href = '/login';
                    } else if (xhr.responseJSON && xhr.responseJSON.message) {
                        errorMsg = xhr.responseJSON.message;
                    } else if (xhr.responseJSON && xhr.responseJSON.errors) {
                        // Collect validation errors
                        let errors = Object.values(xhr.responseJSON.errors).flat();
                        errorMsg = 'Validation Error:\n' + errors.join('\n');
                    }

                    alert(errorMsg);
                }
            });
        });
    }
});
