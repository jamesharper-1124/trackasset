document.addEventListener('DOMContentLoaded', function () {
    // Note: auth-guard.js handles the global ajaxSetup and error handling.
    // This script focuses on the specific form behavior for Adding Inventory.

    const form = document.querySelector('form[action*="inventories"]');

    if (form) {
        $(form).on('submit', function (e) {
            e.preventDefault();

            // 1. Dynamic Token Check (Double Safety)
            const token = localStorage.getItem('auth_token');
            if (!token) {
                alert('Session Expired. Please log in again.');
                localStorage.removeItem('auth_token');
                window.location.href = '/login';
                return;
            }

            const $btn = $(this).find('button[type="submit"]');
            const originalText = $btn.text();

            $btn.prop('disabled', true).text('Adding...');

            const formData = new FormData(this);
            // Ensure we don't accidentally send _method=PUT from any old logic
            formData.delete('_method');

            const submitUrl = $(this).attr('action');

            $.ajax({
                url: submitUrl,
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (response) {
                    // Always alert the message first
                    alert(response.message || 'Inventory item added successfully.');

                    if (response.redirect) {
                        window.location.href = response.redirect;
                    } else {
                        window.location.href = '/inventories';
                    }
                },
                error: function (xhr) {
                    $btn.prop('disabled', false).text(originalText);

                    // 401 is handled globally by auth-guard, but we can handle specific validation errors here
                    if (xhr.status === 422) {
                        let errors = xhr.responseJSON.errors;
                        let msg = 'Validation Error:\n';
                        for (let field in errors) {
                            msg += `- ${errors[field][0]}\n`;
                        }
                        alert(msg);
                    } else if (xhr.status !== 401) {
                        let msg = 'Addition failed.';
                        if (xhr.responseJSON && xhr.responseJSON.message) {
                            msg += ' ' + xhr.responseJSON.message;
                        }
                        alert(msg);
                    }
                }
            });
        });
    }
});
