$(document).ready(function () {
    // Load Server-Side Logo
    $('#app-logo').attr('src', CONFIG.apiUrl('/images/inventory/default.png'));

    const $form = $('#forgot-password-form');

    if ($form.length) {
        $form.on('submit', function (e) {
            e.preventDefault();

            // Clear previous messages
            $('#alert-container').empty();

            // Collect data
            const formData = {
                email: $('input[name="email"]').val()
            };

            // Disable button
            const $btn = $(this).find('button[type="submit"]');
            const originalText = $btn.text();
            $btn.prop('disabled', true).text('Sending...');

            $.ajax({
                url: CONFIG.apiUrl('/api/forgot-password'),
                method: 'POST',
                data: JSON.stringify(formData),
                contentType: 'application/json',
                headers: {
                    'Accept': 'application/json'
                },
                success: function (data) {
                    showSuccess(data.status || 'We have emailed your password reset link!');
                },
                error: function (xhr) {
                    let msg = 'An error occurred';
                    if (xhr.responseJSON) {
                        if (xhr.responseJSON.message) {
                            msg = xhr.responseJSON.message;
                        } else if (xhr.responseJSON.email) {
                            msg = xhr.responseJSON.email[0];
                        } else if (xhr.responseJSON.errors && xhr.responseJSON.errors.email) {
                            msg = xhr.responseJSON.errors.email[0];
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
            .text(message);

        $('#alert-container').html($successDiv);
    }
});
