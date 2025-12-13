document.addEventListener('DOMContentLoaded', function () {

    // 1. Initial Data Fetch
    fetchUsersData();

    // 2. Global State
    let allUsers = [];
    let selectedUserIds = new Set();

    // Elements
    const adminsContainer = document.getElementById('admins-container');
    const staffsContainer = document.getElementById('staffs-container');
    const usersContainer = document.getElementById('users-container');

    const adminsSection = document.getElementById('admins-section');
    const staffsSection = document.getElementById('staffs-section');
    const usersSection = document.getElementById('users-section');

    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('user-search');

    const btnDeleteSelected = document.getElementById('btn-delete-selected');
    const selectedCountSpan = document.getElementById('selected-count');

    // 3. Fetch Function
    function fetchUsersData() {
        $.ajax({
            url: CONFIG.apiUrl('/api/users/data'),
            method: 'GET',
            success: function (data) {
                // Determine current user role for sidebar visibility
                if (data.currentUser && data.currentUser.role === 'admin') {
                    document.getElementById('nav-users').style.display = 'flex';
                }

                // Organize data
                // The API returns { admins: [], staffs: [], users: [], currentUser: {} }
                allUsers = [
                    ...data.admins.map(u => ({ ...u, _section: 'admin' })),
                    ...data.staffs.map(u => ({ ...u, _section: 'staff' })),
                    ...data.users.map(u => ({ ...u, _section: 'user' }))
                ];

                renderAllUsers(allUsers);
                renderAllUsers(allUsers);
                loadingState.style.display = 'none';

                // Update Header Profile (Parity with Dashboard)
                if (data.currentUser) {
                    const nameDisplay = document.getElementById('user-name-display');
                    const imgDisplay = document.getElementById('user-profile-img');

                    if (nameDisplay) {
                        nameDisplay.textContent = data.currentUser.firstname || 'User';
                    }
                    if (imgDisplay && data.currentUser.profile_photo) {
                        let src = data.currentUser.profile_photo;
                        if (!src.startsWith('http')) {
                            const path = src.startsWith('/') ? src : `/${src}`;
                            src = CONFIG.apiUrl(path);
                        }
                        imgDisplay.src = src;
                    }
                }
            },
            error: function (xhr) {
                console.error('Failed to load users', xhr);
                loadingState.textContent = 'Error loading users.';
            }
        });
    }

    // 4. Render Logic
    function renderAllUsers(usersToRender) {
        // Clear containers
        adminsContainer.innerHTML = '';
        staffsContainer.innerHTML = '';
        usersContainer.innerHTML = '';

        // Filter by section
        const admins = usersToRender.filter(u => u._section === 'admin');
        const staffs = usersToRender.filter(u => u._section === 'staff');
        const users = usersToRender.filter(u => u._section === 'user');

        // Toggle Sections Visibility
        if (admins.length > 0) {
            adminsSection.style.display = 'block';
            admins.forEach(u => adminsContainer.appendChild(createUserCard(u)));
        } else {
            adminsSection.style.display = 'none';
        }

        if (staffs.length > 0) {
            staffsSection.style.display = 'block';
            staffs.forEach(u => staffsContainer.appendChild(createUserCard(u)));
        } else {
            staffsSection.style.display = 'none';
        }

        if (users.length > 0) {
            usersSection.style.display = 'block';
            users.forEach(u => usersContainer.appendChild(createUserCard(u)));
        } else {
            usersSection.style.display = 'none';
        }

        // Global Empty State
        if (usersToRender.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
        }
    }

    function createUserCard(user) {
        const card = document.createElement('div');
        card.className = 'user-card';
        card.dataset.id = user.id;

        // Image handling with CONFIG.apiUrl
        let photoUrl = 'images/profile_pic/default.png'; // Corrected default fallback
        if (user.profile_photo) {
            let src = user.profile_photo;
            if (!src.startsWith('http')) {
                const path = src.startsWith('/') ? src : `/${src}`;
                src = CONFIG.apiUrl(path);
            }
            photoUrl = src;
        }

        // Avatar
        const avatarHtml = `
            <div class="user-avatar">
                <img src="${photoUrl}" alt="${user.firstname}" onerror="this.src='images/profile_pic/default.png'">
            </div>
        `;

        // Checkbox (Only for non-admins usually, but let's allow all except self maybe? 
        // Blade logic: admins cannot be deleted by button, but checkbox logic might differ. 
        // Let's mimic blade: checkbox is present but maybe hidden/disabled for safe admins? 
        // Actually blade had checkbox input type hidden for some reason or just standard.
        // We'll add a visible checkbox for bulk actions.

        let checkboxHtml = '';
        if (user.role !== 'admin') { // Prevent deleting admins via bulk?
            checkboxHtml = `
                <div class="card-checkbox-wrapper">
                    <input type="checkbox" class="user-checkbox" value="${user.id}">
                </div>
            `;
        }

        // Match Blade Template EXACTLY
        const editUrl = `edit_user.html?id=${user.id}`;
        const deleteButton = user.role === 'admin'
            ? `<button type="button" class="btn-icon btn-disabled-delete" title="Delete" onclick="alert('You cannot delete an admin account.');">
                 <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
               </button>`
            : `<button type="button" class="btn-icon btn-delete" title="Delete" data-id="${user.id}" onclick="deleteSingleUser(${user.id})">
                 <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
               </button>`;

        let fullName = `${user.firstname || ''} ${user.lastname || ''}`.trim();

        // Exact Blade Structure
        card.innerHTML = `
            <input type="checkbox" class="user-checkbox" value="${user.id}" data-role="${user.role}">
            <div class="user-avatar">
                <img src="${photoUrl}" alt="${user.firstname}" onerror="this.src='images/profile_pic/default.png'">
            </div>
            <div class="user-info">
                <h3 class="card-user-name" title="${fullName}">
                    ${fullName}
                </h3>
                <p class="user-id" style="font-size: 0.8rem; color: #6b7280;">User ID: ${user.id}</p>
                <p class="user-role">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
            </div>
            <div class="user-actions">
                <a href="${editUrl}" class="btn-icon btn-edit" title="Edit" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none;">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 100%; height: 100%;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </a>
                ${deleteButton}
            </div>
        `;

        return card;
    }


    // 5. Search Logic
    searchInput.addEventListener('input', function (e) {
        const term = e.target.value.toLowerCase();
        const filtered = allUsers.filter(u =>
            u.firstname.toLowerCase().includes(term) ||
            u.lastname.toLowerCase().includes(term) ||
            String(u.id).includes(term)
        );
        renderAllUsers(filtered);
    });

    // 6. Delete Logic
    window.deleteSingleUser = function (id) {
        if (!confirm('Are you sure you want to delete this user?')) return;

        $.ajax({
            url: CONFIG.apiUrl(`/api/users/${id}`),
            method: 'DELETE',
            success: function () {
                alert('User deleted successfully.');
                fetchUsersData(); // Refresh
            },
            error: function (xhr) {
                alert('Delete failed: ' + (xhr.responseJSON?.message || 'Error'));
            }
        });
    };

    // Bulk Delete
    $(document).on('change', '.user-checkbox', function () {
        const id = parseInt(this.value);
        if (this.checked) selectedUserIds.add(id);
        else selectedUserIds.delete(id);
        updateDeleteButton();
    });

    function updateDeleteButton() {
        selectedCountSpan.textContent = selectedUserIds.size;
        btnDeleteSelected.style.display = selectedUserIds.size > 0 ? 'inline-flex' : 'none';
    }

    btnDeleteSelected.addEventListener('click', function () {
        if (!confirm(`Delete ${selectedUserIds.size} users?`)) return;

        const ids = Array.from(selectedUserIds);
        $.ajax({
            url: CONFIG.apiUrl('/api/users/bulk-delete'),
            method: 'DELETE',
            data: { ids: ids },
            success: function () {
                alert('Users deleted.');
                selectedUserIds.clear();
                updateDeleteButton();
                fetchUsersData();
            },
            error: function (xhr) {
                alert('Bulk delete failed.');
            }
        });
    });

});
