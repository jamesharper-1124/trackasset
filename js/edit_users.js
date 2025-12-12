$(document).ready(function () {
    console.log('Edit Users Script Loaded');

    const form = $('form[data-mode="edit"]');

    if (form.length > 0) {
        form.on('submit', function (e) {
            e.preventDefault();
            console.log('Form submission intercepted');

            const token = localStorage.getItem('auth_token');
            if (!token) {
                alert('Authentication token missing. Please login again.');
                window.location.href = '/login';
                return;
            }

            const userId = form.data('id');
            const formData = new FormData(this);

            // Spoof PUT method for Laravel
            formData.append('_method', 'PUT');

            // Log data for debugging (excluding sensitive stuff generally, but helpful here)
            for (var pair of formData.entries()) {
                console.log(pair[0] + ', ' + pair[1]);
            }

            $.ajax({
                url: $(this).attr('action'), // Use the form's action attribute (e.g. /api/users/{id})
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
                        alert('User updated successfully');
                        window.location.href = response.redirect;
                    } else {
                        alert('User updated successfully');
                        window.location.href = '/users';
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
