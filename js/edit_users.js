document.addEventListener('DOMContentLoaded', function () {
    console.log('Edit Users Script Loaded');

    // 1. Get User ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    if (!userId) {
        alert('No user ID specified.');
        window.location.href = 'users.html';
        return;
    }

    const form = document.getElementById('edit-user-form');
    const token = localStorage.getItem('auth_token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Fetch User Data
    if (form) {
        // Set Action URL dynamically
        const apiUrl = CONFIG.apiUrl('/api/users/' + userId);
        form.setAttribute('action', apiUrl);

        // Fetch Data
        $.ajax({
            url: apiUrl,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (data) {
                const user = data.user || data; // Handle {user: ...} or direct object
                console.log('User fetched:', user);

                // Populate Inputs
                $('input[name="firstname"]').val(user.firstname);
                $('input[name="lastname"]').val(user.lastname);
                $('input[name="email"]').val(user.email);
                $('input[name="username"]').val(user.username);
                $('input[name="phone"]').val(user.phone);
                $('input[name="address"]').val(user.address);
                $('select[name="role"]').val(user.role);

                // Handle Profile Photo Preview
                if (user.profile_photo_url) {
                    let photoUrl = user.profile_photo_url;
                    if (!photoUrl.startsWith('http')) {
                        photoUrl = CONFIG.apiUrl(photoUrl);
                    }
                    $('#preview-img').attr('src', photoUrl);
                }
            },
            error: function (err) {
                console.error('Fetch error:', err);
                alert('Failed to load user data.');
                window.location.href = 'users.html';
            }
        });

        // 3. Handle Submission
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log('Submitting update...');

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Updating...';

            const formData = new FormData(this);
            formData.append('_method', 'PUT'); // Laravel requirement

            // Handle Image Compression (Optional but good)
            // For now, simpler direct send to match add_users if possible, but let's stick to basics first

            $.ajax({
                url: apiUrl,
                method: 'POST', // POST with _method=PUT
                data: formData,
                processData: false,
                contentType: false,
                headers: { 'Authorization': 'Bearer ' + token },
                success: function (response) {
                    alert('User updated successfully.');
                    window.location.href = 'users.html'; // Force Local Redirect
                },
                error: function (xhr) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                    let msg = 'Update failed.';
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        msg += ' ' + xhr.responseJSON.message;
                    }
                    alert(msg);
                }
            });
        });
    }

    // Sidebar & Dropdown Toggles (Copied from generic scripts)
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const dropdownBtn = document.getElementById('dropdown-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');

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

    if (dropdownBtn && dropdownMenu) {
        dropdownBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
        });
        document.addEventListener('click', function (e) {
            if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.style.display = 'none';
            }
        });
    }
});

// Global Preview Function
function previewImage(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('preview-img').src = e.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    }
}
