
document.addEventListener('DOMContentLoaded', function () {
    const userSelect = document.getElementById('user-select');
    const selectedUsersContainer = document.getElementById('selected-users-container');
    const hiddenInputsContainer = document.getElementById('hidden-inputs');
    const selectedUserIds = new Set();
    const errorMessage = document.getElementById('error-message');

    // Sidebar Toggle Logic
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

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            localStorage.removeItem('auth_token');
            window.location.href = 'login.html';
        });
    }


    // --------------------------------------------------------------------------
    // 1. Fetch Users for Dropdown
    // --------------------------------------------------------------------------
    fetchUsers();

    function fetchUsers() {
        $.ajax({
            url: CONFIG.apiUrl('/api/users/data'),
            method: 'GET',
            success: function (data) {
                if (data && data.users) {
                    populateUserSelect(data.users);
                }
            },
            error: function (xhr) {
                console.error('Error fetching users:', xhr);
                userSelect.innerHTML = '<option value="" disabled selected>Error loading users</option>';
            }
        });
    }

    function populateUserSelect(users) {
        userSelect.innerHTML = '<option value="" disabled selected>Select User</option>';
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;

            // Fix Profile Image URL for Data Attribute
            let photo = user.profile_photo || 'images/profile_pic/default.png';
            if (!photo.startsWith('http')) {
                const path = photo.startsWith('/') ? photo : '/' + photo;
                const storagePath = path.includes('storage') ? path : '/storage' + path;
                if (!path.includes('default.png')) {
                    photo = CONFIG.apiUrl(storagePath);
                } else {
                    photo = CONFIG.apiUrl('/images/profile_pic/default.png');
                }
            }

            option.setAttribute('data-image', photo);
            option.setAttribute('data-name', `${user.firstname} ${user.lastname}`);
            option.textContent = `${user.firstname} ${user.lastname} (${user.role.charAt(0).toUpperCase() + user.role.slice(1)})`;
            userSelect.appendChild(option);
        });
    }

    // --------------------------------------------------------------------------
    // 2. Logic for Image Preview
    // --------------------------------------------------------------------------
    const roomInput = document.getElementById('room_photo_input');
    const roomWrapper = document.getElementById('room-image-wrapper');
    const roomPreview = document.getElementById('preview-img');

    if (roomWrapper && roomInput) {
        roomWrapper.addEventListener('click', (e) => {
            if (e.target !== roomInput) {
                roomInput.click();
            }
        });

        roomInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        roomInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                if (file.size > 10 * 1024 * 1024) {
                    alert('File too large (Max 10MB)');
                    this.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = function (e) {
                    roomPreview.src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // --------------------------------------------------------------------------
    // 3. User Selection Logic (Multi-select)
    // --------------------------------------------------------------------------
    function setupRemoveButton(button, userId) {
        button.addEventListener('click', function () {
            selectedUserIds.delete(userId);
            const tag = button.closest('.user-tag');
            if (tag) tag.remove();
            const input = document.getElementById(`input-user-${userId}`);
            if (input) input.remove();

            const optionToShow = userSelect.querySelector(`option[value="${userId}"]`);
            if (optionToShow) {
                optionToShow.style.display = '';
            }
        });
    }

    userSelect.addEventListener('change', function () {
        const selectedOption = userSelect.options[userSelect.selectedIndex];
        const userId = selectedOption.value;

        if (userId && !selectedUserIds.has(userId)) {
            selectedUserIds.add(userId);
            const userName = selectedOption.getAttribute('data-name');
            const userImage = selectedOption.getAttribute('data-image');

            selectedOption.style.display = 'none';

            const tag = document.createElement('div');
            tag.className = 'user-tag';
            tag.style.display = 'flex';
            tag.style.alignItems = 'center';
            tag.style.gap = '0.5rem';
            tag.style.backgroundColor = '#e5e7eb';
            tag.style.padding = '0.25rem 0.5rem';
            tag.style.borderRadius = '9999px';
            tag.style.fontSize = '0.875rem';

            tag.innerHTML = `
                <img src="${userImage}" alt="${userName}" style="width: 1.5rem; height: 1.5rem; border-radius: 50%; object-fit: cover;">
                <span>${userName}</span>
                <button type="button" class="remove-user-btn" data-id="${userId}" style="background: none; border: none; cursor: pointer; color: #6b7280; font-size: 1rem; line-height: 1;">&times;</button>
            `;

            selectedUsersContainer.appendChild(tag);

            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'managed_by[]';
            input.value = userId;
            input.id = `input-user-${userId}`;
            hiddenInputsContainer.appendChild(input);

            const removeBtn = tag.querySelector('.remove-user-btn');
            setupRemoveButton(removeBtn, userId);
        }
        userSelect.value = "";
    });

    // --------------------------------------------------------------------------
    // 4. Form Submission
    // --------------------------------------------------------------------------
    const roomForm = document.getElementById('add-room-form');
    if (roomForm) {
        roomForm.addEventListener('submit', function (e) {
            e.preventDefault();
            errorMessage.style.display = 'none';

            const token = localStorage.getItem('auth_token');
            if (!token) {
                alert('Session Expired');
                window.location.href = 'login.html';
                return;
            }

            const formData = new FormData(this);

            $.ajax({
                url: CONFIG.apiUrl('/api/rooms'), // Standard REST endpoint
                method: 'POST',
                data: formData,
                processData: false, // Required for FormData
                contentType: false, // Required for FormData
                success: function (data) {
                    alert('Room added successfully.');
                    window.location.href = 'rooms.html';
                },
                error: function (xhr) {
                    if (xhr.status !== 401) {
                        let msg = 'Failed to save room.';
                        if (xhr.responseJSON && xhr.responseJSON.message) {
                            msg = xhr.responseJSON.message;
                        } else if (xhr.responseJSON && xhr.responseJSON.errors) {
                            msg = Object.values(xhr.responseJSON.errors).flat().join('\n');
                        }
                        errorMessage.textContent = msg;
                        errorMessage.style.display = 'block';
                        window.scrollTo(0, 0);
                    }
                }
            });
        });
    }
});
