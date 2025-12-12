/* File: public/js/register.js
   Handles the multi-step registration form pagination and validation.
*/

$(document).ready(function () {
    // Handle Registration Form Submission
    $('#register-form').on('submit', function (e) {
        e.preventDefault();

        // Clear previous errors
        $('.bg-red-100').remove();

        const formData = {
            firstname: $('input[name="firstname"]').val(),
            lastname: $('input[name="lastname"]').val(),
            email: $('input[name="email"]').val(),
            username: $('input[name="username"]').val(),
            password: $('input[name="password"]').val()
        };

        $.ajax({
            url: '/api/register',
            method: 'POST',
            data: JSON.stringify(formData),
            contentType: 'application/json',
            headers: {
                'Accept': 'application/json'
            },
            success: function (response) {
                // Success - Redirect to verify page or login
                // Assuming the API returns a redirect URL or we default to verification
                window.location.href = response.redirect || '/verify';
            },
            error: function (xhr) {
                let message = 'Registration failed.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    message = xhr.responseJSON.message;
                } else if (xhr.responseJSON && xhr.responseJSON.errors) {
                    // Check for validation errors object
                    let errors = Object.values(xhr.responseJSON.errors).flat();
                    message = errors.join('<br>');
                }

                showError(message);
            }
        });
    });

    function showError(message) {
        const errorHtml = `
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <ul><li>${message}</li></ul>
            </div>
        `;
        // Insert before the form
        $('#register-form').before(errorHtml);
    }
});

// Global functions for inline onclick handlers (Step navigation)
window.showStep2 = function () {
    // 1. Get Values
    const fname = document.querySelector('input[name="firstname"]').value;
    const lname = document.querySelector('input[name="lastname"]').value;
    const email = document.querySelector('input[name="email"]').value;

    // 2. Simple Frontend Validation
    if (fname === '' || lname === '' || email === '') {
        alert('Please fill in First Name, Last Name, and Email before proceeding.');
        return; // Stop here if empty
    }

    // 3. Switch Views
    $('#step1').addClass('hidden');
    $('#step2').removeClass('hidden');
}

window.showStep1 = function () {
    $('#step2').addClass('hidden');
    $('#step1').removeClass('hidden');
}