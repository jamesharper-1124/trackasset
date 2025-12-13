document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = '/login?error=session_expired';
        return;
    }

    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const dropdownBtn = document.getElementById('dropdown-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');

    // Sidebar Toggle
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            sidebar.classList.toggle('show');
            sidebarOverlay.classList.toggle('show');
        });
    }

    // Close Sidebar on Overlay Click
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function () {
            sidebar.classList.remove('show');
            sidebarOverlay.classList.remove('show');
        });
    }

    // Dropdown Toggle
    if (dropdownBtn && dropdownMenu) {
        dropdownBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.style.display = 'none';
            }
        });
    }
    // Generic AJAX Form Handler for User Forms (Add, Edit, Settings)
    const userForm = document.querySelector('form[action*="/users"], form[action*="/settings"]');
    if (userForm) {
        userForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;

            const token = localStorage.getItem('auth_token');
            if (!token) {
                alert('Session Expired. Please log in again.');
                localStorage.removeItem('auth_token');
                window.location.href = '/login';
                return;
            }

            // UI Loading State
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing...';

            // Helper to Compress Image
            async function compressImage(file) {
                return new Promise((resolve, reject) => {
                    const maxWidth = 1024;
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = function (event) {
                        const img = new Image();
                        img.src = event.target.result;
                        img.onload = function () {
                            const canvas = document.createElement('canvas');
                            let width = img.width;
                            let height = img.height;

                            if (width > maxWidth) {
                                height *= maxWidth / width;
                                width = maxWidth;
                            }

                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);

                            canvas.toBlob((blob) => {
                                if (blob) {
                                    resolve(blob);
                                } else {
                                    reject(new Error('Canvas toBlob failed'));
                                }
                            }, 'image/jpeg', 0.7);
                        };
                        img.onerror = function (err) {
                            reject(new Error('Image load failed'));
                        };
                    };
                    reader.onerror = function (err) {
                        reject(new Error('FileReader failed'));
                    };
                });
            }

            const processForm = async () => {
                const formData = new FormData(this);
                const fileInput = this.querySelector('input[name="profile_photo"]');

                if (fileInput && fileInput.files[0]) {
                    // Logic: If > 1MB, compress. Else use original
                    if (fileInput.files[0].size > 1 * 1024 * 1024) {
                        submitBtn.textContent = 'Compressing...';
                        try {
                            const compressedBlob = await compressImage(fileInput.files[0]);
                            // Replace the file in FormData
                            // Note: 'profile_photo' needs to match the input name
                            formData.set('profile_photo', compressedBlob, fileInput.files[0].name);
                        } catch (err) {
                            console.error('Compression failed, using original', err);
                        }
                    }
                }

                submitBtn.textContent = 'Saving...';

                // Construct correct API URL
                let actionUrl = this.getAttribute('action');
                if (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL && actionUrl.startsWith('/')) {
                    actionUrl = CONFIG.API_BASE_URL + actionUrl;
                }

                console.log('Submitting form to:', actionUrl); // DEBUG LOG

                $.ajax({
                    url: actionUrl,
                    method: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (data) {
                        alert('Profile has been added successfully. Let the user know to check its email for verification.');
                        if (data.redirect) {
                            window.location.href = data.redirect;
                        } else {
                            submitBtn.disabled = false;
                            submitBtn.textContent = originalBtnText;
                        }
                    },
                    error: function (xhr) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalBtnText;

                        if (xhr.status !== 401) {
                            let msg = 'Failed.';
                            if (xhr.responseJSON && xhr.responseJSON.message) {
                                msg += ' ' + xhr.responseJSON.message;
                            } else if (xhr.responseJSON && xhr.responseJSON.errors) {
                                msg += '\n' + JSON.stringify(xhr.responseJSON.errors);
                            }
                            alert(msg);
                        }
                    }
                });
            };

            processForm();
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
