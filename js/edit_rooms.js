document.addEventListener('DOMContentLoaded', function () {
    console.log("DEBUG: edit_rooms.js Loaded");

    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('id');

    if (!roomId) {
        alert('Invalid Room ID');
        window.location.href = 'rooms.html';
        return;
    }

    const userSelect = document.getElementById('user-select');
    const selectedUsersContainer = document.getElementById('selected-users-container');
    const hiddenInputsContainer = document.getElementById('hidden-inputs');
    const selectedUserIds = new Set();
    const errorMessage = document.getElementById('error-message');
    const form = document.getElementById('edit-room-form');

    // Sidebar & Dropdown Logic
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const dropdownBtn = document.getElementById('dropdown-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
            sidebarOverlay.classList.toggle('show');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('show');
            sidebarOverlay.classList.remove('show');
        });
    }

    if (dropdownBtn && dropdownMenu) {
        dropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
        });
        document.addEventListener('click', (e) => {
            if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.style.display = 'none';
            }
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('auth_token');
            window.location.href = 'login.html';
        });
    }

    // --------------------------------------------------------------------------
    // 1. Fetch Data (Room + Users)
    // --------------------------------------------------------------------------
    Promise.all([fetchUsers(), fetchRoomDetails()])
        .then(() => {
            console.log('All data loaded');
        })
        .catch(err => {
            console.error('Error loading data:', err);
            errorMessage.textContent = 'Failed to load data.';
            errorMessage.style.display = 'block';
        });

    function fetchUsers() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: CONFIG.apiUrl('/api/users/data'),
                method: 'GET',
                success: function (data) {
                    if (data) {
                        // Aggregate Admins and Staff ONLY
                        const authorizedUsers = [
                            ...(data.admins || []),
                            ...(data.staffs || [])
                        ];
                        populateUserSelect(authorizedUsers);
                        resolve();
                    }
                },
                error: function (xhr) {
                    console.error('Error fetching users:', xhr);
                    userSelect.innerHTML = '<option value="" disabled selected>Error loading users</option>';
                    reject(xhr);
                }
            });
        });
    }

    function populateUserSelect(users) {
        userSelect.innerHTML = '<option value="" disabled selected>Select User</option>';
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;

            let photo = user.profile_photo || 'images/profile_pic/default.png';
            if (!photo.startsWith('http')) {
                const path = photo.startsWith('/') ? photo.substring(1) : photo;
                if (path.includes('storage')) {
                    photo = CONFIG.apiUrl('/' + path);
                } else if (path.startsWith('images/')) {
                    photo = CONFIG.apiUrl('/' + path);
                } else {
                    photo = CONFIG.apiUrl('/storage/' + path);
                }
            }

            option.setAttribute('data-image', photo);
            option.setAttribute('data-name', `${user.firstname} ${user.lastname}`);
            option.textContent = `${user.firstname} ${user.lastname} (${user.role.charAt(0).toUpperCase() + user.role.slice(1)})`;
            userSelect.appendChild(option);
        });
    }

    function fetchRoomDetails() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: CONFIG.apiUrl(`/api/rooms/${roomId}`),
                method: 'GET',
                success: function (data) {
                    if (data && data.room) {
                        populateForm(data.room);
                        resolve();
                    }
                },
                error: function (xhr) {
                    console.error('Error fetching room:', xhr);
                    reject(xhr);
                }
            });
        });
    }

    function populateForm(room) {
        // Room Name
        form.querySelector('input[name="room_name"]').value = room.room_name;

        // Form Data ID attribute
        form.setAttribute('data-id', room.id);

        // Room Photo
        const previewImg = document.getElementById('preview-img');
        if (room.room_photo) {
            let photoUrl = room.room_photo;
            if (!photoUrl.startsWith('http')) {
                const path = photoUrl.startsWith('/') ? photoUrl.substring(1) : photoUrl;
                if (path.includes('storage')) {
                    photoUrl = CONFIG.apiUrl('/' + path);
                } else if (path.startsWith('images/')) {
                    photoUrl = CONFIG.apiUrl('/' + path);
                } else {
                    photoUrl = CONFIG.apiUrl('/storage/' + path);
                }
            }
            previewImg.src = photoUrl;
        }

        // Managers
        if (room.managers && room.managers.length > 0) {
            room.managers.forEach(manager => {
                // Manually trigger selection logic
                // Ensure ID is string for comparison
                const userId = String(manager.id);

                // Only if not already selected (though logic prevents duplicates)
                if (!selectedUserIds.has(userId)) {
                    // Find option to get details (Image/Name might differ from room.managers response slightly structure wise? usually same)
                    // We can just use the manager object directly since we have it.

                    selectedUserIds.add(userId);

                    const option = userSelect.querySelector(`option[value="${userId}"]`);
                    if (option) option.style.display = 'none';

                    let photo = manager.profile_photo || 'images/profile_pic/default.png';
                    if (!photo.startsWith('http')) {
                        const path = photo.startsWith('/') ? photo.substring(1) : photo;
                        if (path.includes('storage')) {
                            photo = CONFIG.apiUrl('/' + path);
                        } else if (path.startsWith('images/')) {
                            photo = CONFIG.apiUrl('/' + path);
                        } else {
                            photo = CONFIG.apiUrl('/storage/' + path);
                        }
                    }

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
                        <img src="${photo}" alt="${manager.firstname}" style="width: 1.5rem; height: 1.5rem; border-radius: 50%; object-fit: cover;">
                        <span>${manager.firstname} ${manager.lastname}</span>
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
            });
        }
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
            selectedUserIds.delete(String(userId));
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

        if (userId && !selectedUserIds.has(String(userId))) {
            selectedUserIds.add(String(userId));
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
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            errorMessage.style.display = 'none';

            const token = localStorage.getItem('auth_token');
            if (!token) {
                alert('Session Expired');
                window.location.href = 'login.html';
                return;
            }

            const formData = new FormData(this);

            // Force Method Spoofing for Laravel PUT
            if (!formData.has('_method')) {
                formData.append('_method', 'PUT');
            }

            // Explicitly attach file to ensure it's sent AND rename it to match Room Name
            const fileInput = document.getElementById('room_photo_input');
            const roomNameInput = this.querySelector('input[name="room_name"]');

            if (fileInput && fileInput.files[0]) {
                const file = fileInput.files[0];
                let fileName = file.name;

                if (roomNameInput && roomNameInput.value.trim() !== '') {
                    const name = roomNameInput.value.trim().replace(/[^a-zA-Z0-9-_]/g, '_'); // Sanitize
                    const ext = file.name.split('.').pop();
                    fileName = `${name}.${ext}`;
                }

                formData.set('room_photo', file, fileName);
            }

            $.ajax({
                url: CONFIG.apiUrl(`/api/rooms/${roomId}`),
                method: 'POST', // POST with _method=PUT
                data: formData,
                processData: false,
                contentType: false,
                success: function (data) {
                    alert('Room updated successfully.');
                    window.location.href = 'rooms.html';
                },
                error: function (xhr) {
                    if (xhr.status !== 401) {
                        let msg = 'Failed to update room.';
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
