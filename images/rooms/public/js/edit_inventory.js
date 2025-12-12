document.addEventListener('DOMContentLoaded', function () {
    console.log("DEBUG: edit_inventory.js Loaded");

    const form = document.querySelector('form[data-mode="edit"]');

    if (form) {
        $(form).on('submit', function (e) {
            e.preventDefault();

            // Dynamic Token Check
            const token = localStorage.getItem('auth_token');
            if (!token) {
                alert('Session Expired. Please log in again.');
                window.location.href = '/login';
                return;
            }

            const $btn = $(this).find('button[type="submit"]');
            const originalText = $btn.text();

            // Explicitly set Update Mode
            const id = $(this).data('id');
            const loadingText = 'Updating...';

            $btn.prop('disabled', true).text(loadingText);

            const formData = new FormData(this);

            // Force Method Spoofing
            if (!formData.has('_method')) {
                formData.append('_method', 'PUT');
            }

            // Force URL construction
            let submitUrl = '/api/inventories/' + id;
            console.log('DEBUG: Submitting to ' + submitUrl);

            $.ajax({
                url: submitUrl,
                method: 'POST', // Always POST with _method=PUT
                data: formData,
                processData: false,
                contentType: false,
                success: function (response) {
                    console.log("DEBUG: Success Response", response);
                    alert(response.message || 'Item updated successfully.');
                    window.location.href = '/inventories';
                },
                error: function (xhr) {
                    console.error("DEBUG: Error", xhr);
                    $btn.prop('disabled', false).text(originalText);
                    let msg = 'Update failed.';
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        msg += ' ' + xhr.responseJSON.message;
                    }
                    alert(msg);
                }
            });
        });
    }
});
