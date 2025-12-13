document.addEventListener('DOMContentLoaded', function () {
    console.log('Profile Settings Script Loaded');

    const form = document.getElementById('settings-form');
    const token = localStorage.getItem('auth_token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // 1. Fetch Current User Data
    // We can use the /api/user endpoint provided by Sanctum to get the current user
    const fetchUrl = CONFIG.apiUrl('/api/user');

    $.ajax({
        url: fetchUrl,
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        success: function (user) {
            console.log('Current User Fetched:', user);

            // Populate Inputs
            $('input[name="firstname"]').val(user.firstname);
            $('input[name="lastname"]').val(user.lastname);
            $('input[name="email"]').val(user.email);
            $('input[name="username"]').val(user.username);
            $('input[name="phone"]').val(user.phone);
            $('input[name="address"]').val(user.address);

            // Role Display
            $('input[name="role_display"]').val(user.role.charAt(0).toUpperCase() + user.role.slice(1));

            // Handle Profile Photo Preview
            if (user.profile_photo_url || user.profile_photo) {
                let photoUrl = user.profile_photo_url || user.profile_photo;
                if (!photoUrl.startsWith('http')) {
                    photoUrl = CONFIG.apiUrl(photoUrl);
                }
                $('#preview-img').attr('src', photoUrl);

                // Also update header image
                $('#user-profile-img').attr('src', photoUrl);
                $('#user-name-display').text(user.firstname);
            }
        },
        error: function (err) {
            console.error('Fetch error:', err);
            // If 401, auth-guard handles it usually, but just in case
            if (err.status === 401) window.location.href = 'login.html';
        }
    });

    // 2. Handle Submission
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log('Submitting settings update...');

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';

            const formData = new FormData(this);
            formData.append('_method', 'PUT'); // Laravel requirement

            const submitUrl = CONFIG.apiUrl('/api/settings'); // Explicit setting route

            $.ajax({
                url: submitUrl,
                method: 'POST', // POST with _method=PUT
                data: formData,
                processData: false,
                contentType: false,
                headers: { 'Authorization': 'Bearer ' + token },
                success: function (response) {
                    alert('Profile updated successfully.');
                    window.location.href = 'dashboard.html'; // Redirect to dashboard
                },
                error: function (xhr) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                    let msg = 'Update failed.';
                    if (xhr.status === 422 && xhr.responseJSON.errors) {
                        let errors = Object.values(xhr.responseJSON.errors).flat();
                        msg = 'Validation Error:\n' + errors.join('\n');
                    } else if (xhr.responseJSON && xhr.responseJSON.message) {
                        msg += ' ' + xhr.responseJSON.message;
                    }
                    alert(msg);
                }
            });
        });
    }

    // Sidebar & Dropdown Toggles (Standard)
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const dropdownBtn = document.getElementById('dropdown-btn');
    const dropdownMenu = document.getElementById('dropdown-menu'); // Ensure ID exists in HTML

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            sidebar.classList.toggle('show');
            sidebarOverlay.classList.toggle('show');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function () {
            sidebar.classList.remove('show');
            sidebarOverlay.classList.remove('show');
        });
    }

    // Explicit Dropdown Toggle for Settings Page
    if (dropdownBtn) {
        dropdownBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (dropdownMenu) {
                dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
            }
        });
        document.addEventListener('click', function (e) {
            if (dropdownMenu && !dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.style.display = 'none';
            }
        });
    }
});

function previewImage(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('preview-img').src = e.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    }
}
