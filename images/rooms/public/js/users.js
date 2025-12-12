$(document).ready(function () {
    console.log('USERS.JS RELOADED v3 - REGRESSION CHECK');
    const toggleBtn = $('#delete-toggle-btn');
    const csrfToken = $('meta[name="csrf-token"]').attr('content');
    let isDeleteMode = false;
    let fetchedUsers = [];

    // 1. Fetch Data
    const token = localStorage.getItem('auth_token');
    if (!token) {
        alert('Session Expired. Please log in again.');
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
        return;
    }

    $.ajax({
        url: '/api/users/data',
        method: 'GET',
        // Headers handled by auth-guard.js
        success: function (data) {
            if (data) {
                renderUsersList(data.admins, 'admins-container', data.currentUser);
                renderUsersList(data.staffs, 'staffs-container', data.currentUser);
                renderUsersList(data.users, 'users-container', data.currentUser);
            }
        },
        error: function (xhr) {
            // 401 handled globally
            if (xhr.status !== 401) {
                console.error('Error loading users:', xhr);
            }
        }
    });


    // 2. Render Function
    function renderUsersList(users, containerId, currentUser) {
        console.log('Rendering users for:', containerId); // DEBUG: Cache check
        const container = $(`#${containerId}`);
        container.empty();

        if (!users || users.length === 0) {
            container.append('<div style="grid-column: 1/-1; text-align: center; color: #6b7280; padding: 1rem;">No users found.</div>');
            return;
        }

        users.forEach(user => {
            const isSelf = user.id === currentUser.id;
            const isAdmin = user.role === 'admin';

            let actionHtml = '';

            // Edit Button
            actionHtml += `
                <a href="/users/${user.id}/edit" class="btn-icon btn-edit" title="Edit" 
                   style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none;">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 100%; height: 100%;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z">
                        </path>
                    </svg>
                </a>`;

            // Delete Button Logic
            if (isAdmin) {
                actionHtml += `
                    <button type="button" class="btn-icon btn-disabled-delete" title="Delete" onclick="alert('You cannot delete an admin account.');">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
                            </path>
                        </svg>
                    </button>`;
            } else if (isSelf) {
                // Should technically not happen if list logic is correct, but safe guard
                actionHtml += `
                    <button type="button" class="btn-icon btn-disabled-delete" title="Delete" onclick="alert('You cannot delete yourself.');">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>`;
            } else {
                actionHtml += `
                    <button type="button" class="btn-icon btn-delete" title="Delete" data-id="${user.id}">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>`;
            }

            const card = `
                <div class="user-card">
                    <input type="checkbox" class="user-checkbox" value="${user.id}" data-role="${user.role}" style="display: none;">
                    <div class="user-avatar">
                        <img src="/${user.profile_photo}" alt="${user.firstname}">
                    </div>
                    <div class="user-info">
                        <h3 class="user-name" title="${user.firstname} ${user.lastname}">
                           ${(user.firstname + ' ' + user.lastname).substring(0, 20)}
                        </h3>
                        <p class="user-id" style="font-size: 0.8rem; color: #6b7280;">User ID: ${user.id}</p>
                        <p class="user-role">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                    </div>
                    <div class="user-actions">
                        ${actionHtml}
                    </div>
                </div>
            `;
            container.append(card);
        });
    }

    // Toggle Delete Mode
    toggleBtn.on('click', function () {
        if (!isDeleteMode) {
            // Enter Delete Mode
            isDeleteMode = true;
            $('.user-checkbox').show();
            $(this).html(`
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 1.25rem; height: 1.25rem; margin-right: 0.5rem;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg> Delete Selected
            `);
        } else {
            // Execute Delete or Cancel
            const token = localStorage.getItem('auth_token');
            if (!token) {
                alert('Session Expired. Please log in again.');
                localStorage.removeItem('auth_token');
                window.location.href = '/login';
                return;
            }

            const selectedIds = [];
            let hasAdmin = false;
            $('.user-checkbox:checked').each(function () {
                selectedIds.push($(this).val());
                if ($(this).data('role') === 'admin') {
                    hasAdmin = true;
                }
            });

            if (selectedIds.length === 0) {
                // Cancel
                isDeleteMode = false;
                $('.user-checkbox').hide();
                $('.user-checkbox').prop('checked', false);
                $(this).html(`
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 1.25rem; height: 1.25rem; margin-right: 0.5rem;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg> Delete Multiple
                `);
                return;
            }

            if (hasAdmin) {
                alert('You cannot delete an admin account.');
                return;
            }

            if (confirm('Are you sure you want to delete ' + selectedIds.length + ' user(s)?')) {
                executeDelete(selectedIds);
            }
        }
    });

    // Helper: Execute Deletion
    function executeDelete(ids) {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            alert('Session Expired. Please log in again.');
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
            return;
        }

        $.ajax({
            url: '/api/users/bulk-delete',
            method: 'DELETE',
            data: JSON.stringify({ ids: ids }),
            contentType: 'application/json',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            success: function (data) {
                alert('User(s) have been deleted.');
                if (data.success) {
                    location.reload();
                } else {
                    alert(data.message);
                }
            },
            error: function (xhr) {
                // 401 handled globally
                if (xhr.status !== 401) {
                    alert('Error: ' + (xhr.responseJSON ? xhr.responseJSON.message : xhr.statusText));
                }
            }
        });
    }

    // Event Delegation for Single Delete
    $(document).on('click', '.btn-delete', function (e) {
        e.preventDefault();
        console.log('deleteUser called');

        // Debugging Access
        const btn = $(this);
        const id = btn.attr('data-id');

        console.log('--- Delete Debug ---');
        console.log('Clicked Element:', btn[0]);
        console.log('Outer HTML:', btn.prop('outerHTML'));
        console.log('data-id attr:', id);

        if (!id) {
            console.warn('ABORT: No ID found on button');
            return;
        }

        if (!confirm('Are you sure you want to delete this user?')) return;

        executeDelete([id]);
    });

    // Search Logic
    $('.search-input').on('keyup', function () {
        var value = $(this).val().toLowerCase();
        $(".user-card").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        });
    });
});
