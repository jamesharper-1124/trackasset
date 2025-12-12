/* File: public/js/verify.js */

$(document).ready(function () {
    // 1. Get Email from URL
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');

    if (email) {
        $('#user-email').text(email);
        $('#email-input').val(email);
    } else {
        showError('No email provided. Please go back to registration directly.');
    }

    // 2. Handle Form Submission
    $('#verify-form').on('submit', function (e) {
        e.preventDefault();

        // Clear previous messages
        $('#alert-container').empty();

        const code = $('input[name="code"]').val();
        const emailInput = $('input[name="email"]').val();

        $.ajax({
            url: CONFIG.apiUrl('/api/verify'),
            method: 'POST',
            data: JSON.stringify({ email: emailInput, code: code }),
            contentType: 'application/json',
            headers: {
                'Accept': 'application/json'
            },
            success: function (response) {
                // Success
                showAlert('success', 'Account verified successfully! Redirecting to login...');

                // Disable form
                $('input, button').prop('disabled', true);

                setTimeout(function () {
                    window.location.href = 'login.html';
                }, 2000);
            },
            error: function (xhr) {
                let message = 'Verification failed.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    message = xhr.responseJSON.message;
                }
                showAlert('error', message);
            }
        });
    });

    function showAlert(type, message) {
        const colorClass = type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700';
        const html = `
            <div class="${colorClass} border px-4 py-3 rounded mb-4 text-sm">
                ${message}
            </div>
        `;
        $('#alert-container').html(html);
    }
});
