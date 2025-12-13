$(document).ready(function () {
    // Load Server-Side Logo
    $('#app-logo').attr('src', CONFIG.apiUrl('/images/inventory/default.png'));

    // Parse URL Params
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const email = urlParams.get('email');

    // Populate Fields
    if (token) {
        $('#token').val(token);
    } else {
        showError('Invalid password reset link. Token is missing.');
        $('form').find('input, button').prop('disabled', true);
    }

    if (email) {
        $('#email').val(email);
        // Ensure floating label is correctly positioned since value is set
        // But the CSS uses placeholder-shown logic. readonly input with value should work if not placeholder-shown?
        // Let's manually trigger a check or add a class if needed, but 'value' attribute usually triggers :not(:placeholder-shown) if browser detects it.

        // Sometimes browser needs a nudge
        // However, since it is readonly and basicaly just for show, let's hope CSS pseudo-class catches it
        // If not, the label might sit over text. Custom CSS relies on placeholder-shown.
        // If value is present, placeholder is not shown, so label should float up.
    }

    const $form = $('#reset-password-form');

    if ($form.length) {
        $form.on('submit', function (e) {
            e.preventDefault();

            // Clear previous messages
            $('#alert-container').empty();

            // Collect data
            const formData = {
                token: $('input[name="token"]').val(),
                email: $('input[name="email"]').val(),
                password: $('input[name="password"]').val(),
                password_confirmation: $('input[name="password_confirmation"]').val()
            };

            // Disable button
            const $btn = $(this).find('button[type="submit"]');
            const originalText = $btn.text();
            $btn.prop('disabled', true).text('Resetting...');

            $.ajax({
                url: CONFIG.apiUrl('/api/reset-password'),
                method: 'POST',
                data: JSON.stringify(formData),
                contentType: 'application/json',
                headers: {
                    'Accept': 'application/json'
                },
                success: function (data) {
                    showSuccess('Your password has been reset!');
                    // Redirect to login after a delay
                    setTimeout(function () {
                        window.location.href = 'login.html';
                    }, 2000);
                },
                error: function (xhr) {
                    let msg = 'An error occurred';
                    if (xhr.responseJSON) {
                        if (xhr.responseJSON.message) {
                            msg = xhr.responseJSON.message;
                        } else if (xhr.responseJSON.errors) {
                            // Collect all errors
                            let errors = [];
                            for (let key in xhr.responseJSON.errors) {
                                errors.push(xhr.responseJSON.errors[key][0]);
                            }
                            msg = errors.join('<br>');
                        }
                    }
                    showError(msg);
                },
                complete: function () {
                    $btn.prop('disabled', false).text(originalText);
                }
            });
        });
    }

    function showError(message) {
        const $errorDiv = $('<div>')
            .addClass('bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm')
            .html(`<ul><li>${message}</li></ul>`);

        $('#alert-container').html($errorDiv);
    }

    function showSuccess(message) {
        const $successDiv = $('<div>')
            .addClass('bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm')
            .html(`<p>${message}</p><p class="mt-2 text-xs">Redirecting to login...</p>`);

        $('#alert-container').html($successDiv);
    }
});
