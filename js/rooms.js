
document.addEventListener('DOMContentLoaded', function () {
    console.log("DEBUG: rooms.js v100 loaded"); // Proof of life
    const token = localStorage.getItem('auth_token');
    if (!token) {
        // auth-guard should handle this, but just in case
        window.location.href = 'login.html';
        return;
    }

    const assignedContainer = document.getElementById('assigned-rooms-container');
    const assignedSection = document.getElementById('assigned-rooms-section');
    const availableContainer = document.getElementById('available-rooms-container');
    const availableTitle = document.getElementById('available-rooms-title');
    const btnDeleteSelected = document.getElementById('btn-delete-selected');
    const selectedCountSpan = document.getElementById('selected-count');

    // Admin Actions Container
    const adminActionsDiv = document.getElementById('admin-actions');

    // Sidebar Toggle Logic (copied from dashboard.js if not global)
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


    // --------------------------------------------------------------------------
    // 1. Initial Data Fetch
    // --------------------------------------------------------------------------
    fetchRoomsData();

    function fetchRoomsData() {
        $.ajax({
            url: CONFIG.apiUrl('/api/rooms/data?t=' + new Date().getTime()),
            method: 'GET',
            success: function (data) {
                if (data) {
                    renderRooms(data);
                }
                updateSelectedCount();
            },
            error: function (xhr) {
                console.error('Error loading rooms:', xhr);
            }
        });
    }

    // --------------------------------------------------------------------------
    // 2. Rendering Logic
    // --------------------------------------------------------------------------
    function renderRooms(data) {
        const { assignedRooms, availableRooms, currentUser } = data;
        const isAdmin = (currentUser.role === 'admin');
        const isUser = (currentUser.role === 'user');

        // Show Admin Actions if Admin
        if (isAdmin && adminActionsDiv) {
            adminActionsDiv.style.display = 'flex';
        }

        // A. Assigned Rooms (Hidden for 'user' role)
        if (!isUser && assignedSection && assignedContainer) {
            assignedSection.style.display = 'block';
            assignedContainer.innerHTML = '';
            if (assignedRooms && assignedRooms.length > 0) {
                assignedRooms.forEach(room => {
                    assignedContainer.appendChild(createRoomCard(room, isAdmin, true));
                });
            } else {
                assignedContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #6b7280; padding: 2rem;">You have no assigned rooms.</div>';
            }
        }

        // B. Available Rooms
        if (availableTitle) {
            if (!isUser) {
                availableTitle.style.marginTop = '2rem';
                availableTitle.style.borderTop = '1px solid #e5e7eb';
                availableTitle.style.paddingTop = '2rem';
            }
        }

        if (availableContainer) {
            availableContainer.innerHTML = '';
            if (availableRooms && availableRooms.length > 0) {
                availableRooms.forEach(room => {
                    availableContainer.appendChild(createRoomCard(room, isAdmin, false));
                });
            } else {
                availableContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #6b7280; padding: 2rem;">No other available rooms.</div>';
            }
        }
    }

    function createRoomCard(room, isAdmin, isAssigned) {
        const div = document.createElement('div');
        div.className = 'card';
        div.setAttribute('data-id', room.id);

        const managers = room.managers || [];
        const managerCount = managers.length;

        let managerHtml = '';
        if (managerCount === 0) {
            managerHtml = '<span style="font-size: 0.875rem; color: #9ca3af; font-style: italic;">Unassigned</span>';
        } else {
            // Avatars
            let avatars = '';
            managers.slice(0, 3).forEach((mgr, idx) => {
                const margin = idx > 0 ? 'margin-left: -0.5rem;' : '';

                // Fix Image URL
                let photo = mgr.profile_photo || 'images/profile_pic/default.png';
                if (!photo.startsWith('http')) {
                    // Assuming local paths need fixing
                    // Helper to ensure we don't double slashes
                    const path = photo.startsWith('/') ? photo : '/' + photo;
                    // Check if path implies storage or needs it - backend usually sends 'profile-photos/...' or 'storage/...'
                    const storagePath = path.includes('storage') ? path : '/storage' + path;
                    // Only use storage path if not default image
                    if (!path.includes('default.png')) {
                        photo = CONFIG.apiUrl(storagePath);
                    } else {
                        photo = CONFIG.apiUrl('/images/profile_pic/default.png');
                    }
                }

                avatars += `<img src="${photo}" alt="${mgr.firstname}" style="width: 1.5rem; height: 1.5rem; border-radius: 9999px; object-fit: cover; border: 2px solid white; ${margin}">`;
            });

            // Text
            let text = '';
            if (managerCount === 1) text = managers[0].firstname;
            else if (managerCount === 2) text = `${managers[0].firstname} & ${managers[1].firstname}`;
            else text = `${managers[0].firstname} and ${managerCount - 1} others`;

            managerHtml = `
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="display: flex; align-items: center;">${avatars}</div>
                        <span style="font-size: 0.875rem; font-weight: 500; color: #374151;">${text}</span>
                    </div>
                `;
        }

        let adminActions = '';
        let adminCheckbox = '';

        if (isAdmin) {
            // Checkbox ALWAYS visible for admin
            adminCheckbox = `<input type="checkbox" class="room-checkbox" value="${room.id}">`;

            adminActions = `
                    <a href="edit_room.html?id=${room.id}" class="btn-sm btn-edit" title="Edit">
                        <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin:0;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </a>
                    <button type="button" class="btn-sm btn-delete" data-id="${room.id}" title="Delete" style="flex: 1;">
                        <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin:0;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                `;
        }

        // Room Photo
        let photoUrl = room.room_photo;
        if (photoUrl) {
            // Remove leading slash for cleaner handling
            let path = photoUrl.startsWith('/') ? photoUrl.substring(1) : photoUrl;

            // Logic:
            // 1. If it starts with 'http', use as is.
            // 2. If it contains 'storage', assume it's a storage path.
            // 3. If it starts with 'images/', assume it's a public asset.
            // 4. Otherwise, assume it needs '/storage/' prepended (Laravel default).

            if (path.startsWith('http')) {
                photoUrl = path;
            } else if (path.includes('storage')) {
                photoUrl = CONFIG.apiUrl('/' + path);
            } else if (path.startsWith('images/')) {
                // public_path upload means direct access (NO storage prefix)
                photoUrl = CONFIG.apiUrl('/' + path);
            } else {
                photoUrl = CONFIG.apiUrl('/storage/' + path);
            }
        } else {
            photoUrl = CONFIG.apiUrl('/images/rooms/default.png');
        }
        console.log(`[DEBUG] Room: ${room.room_name}, Raw Path: ${room.room_photo}, Final URL: ${photoUrl}`);

        div.innerHTML = `
                <div class="card-img-wrapper">
                    ${adminCheckbox}
                    <img src="${photoUrl}" alt="${room.room_name}" class="card-img" onerror="this.onerror=null; this.src='${CONFIG.apiUrl('/images/rooms/default.png')}';">
                </div>
                <div class="card-content">
                    <h3 class="card-title">${room.room_name}</h3>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                        <span style="font-size: 0.875rem; color: #6b7280;">Managed by:</span>
                        ${managerHtml}
                    </div>
                    <div class="card-actions">
                        <a href="view_inventory.html?room_id=${room.id}" class="btn-sm btn-secondary" title="View Inventories">
                            <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin:0;">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                        </a>
                        ${adminActions}
                    </div>
                </div>
            `;

        // Re-bind checkbox change event
        if (isAdmin) {
            const cb = div.querySelector('.room-checkbox');
            if (cb) {
                cb.addEventListener('change', function () {
                    updateSelectedCount();
                });
            }
        }

        return div;
    }

    // --------------------------------------------------------------------------
    // 3. Delegation for Single Delete
    // --------------------------------------------------------------------------
    $(document).on('click', '.btn-delete', function (e) {
        e.preventDefault();

        // 0. VISUAL FEEDBACK: Prove click happened
        const btn = $(this);
        btn.css('background-color', 'red');
        btn.find('svg').css('color', 'white');

        if (!confirm('Are you sure you want to delete this room?')) {
            btn.css('background-color', ''); // Revert color if cancelled
            btn.find('svg').css('color', '');
            return;
        }

        const roomId = btn.data('id');

        $.ajax({
            url: CONFIG.apiUrl(`/api/rooms/${roomId}`),
            method: 'DELETE',
            // Headers handled by auth-guard
            success: function (res) {
                alert(`Success: ${res.message}`);
                fetchRoomsData(); // Re-fetch instead of reload
            },
            error: function (xhr) {
                btn.css('background-color', ''); // Revert on error
                const msg = xhr.responseJSON?.message || xhr.responseText || 'Unknown Error';
                alert(`Error: ${msg}`);
            }
        });
    });

    // --------------------------------------------------------------------------
    // 4. Bulk Delete Logic
    // --------------------------------------------------------------------------
    function updateSelectedCount() {
        const checkboxes = document.querySelectorAll('.room-checkbox:checked');
        const count = checkboxes.length;
        if (selectedCountSpan) selectedCountSpan.textContent = count;

        // Show "Delete Selected" button ONLY if items are selected
        if (btnDeleteSelected) {
            if (count > 0) {
                btnDeleteSelected.style.display = 'inline-flex';
            } else {
                btnDeleteSelected.style.display = 'none';
            }
        }
    }

    if (btnDeleteSelected) {
        btnDeleteSelected.addEventListener('click', function () {
            const selectedIds = Array.from(document.querySelectorAll('.room-checkbox:checked')).map(cb => cb.value);
            // const deleteRoute = btnDeleteSelected.getAttribute('data-route'); // Not using route attribute anymore

            if (selectedIds.length === 0) return;

            if (confirm(`Are you sure you want to delete ${selectedIds.length} rooms?`)) {
                $.ajax({
                    url: CONFIG.apiUrl('/api/rooms/bulk-delete'), // Assuming this is the route, need to verify
                    method: 'DELETE',
                    data: JSON.stringify({ ids: selectedIds }),
                    contentType: 'application/json',
                    // Headers handled by auth-guard
                    success: function (data) {
                        if (data.success) {
                            fetchRoomsData();
                            // Reset checkbox count
                            if (selectedCountSpan) selectedCountSpan.textContent = 0;
                            btnDeleteSelected.style.display = 'none';
                        } else {
                            alert('Something went wrong: ' + (data.message || 'Unknown error'));
                        }
                    },
                    error: function (xhr) {
                        alert('An error occurred.');
                    }
                });
            }
        });
    }

    // --------------------------------------------------------------------------
    // 5. Dynamic Search
    // --------------------------------------------------------------------------
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const searchTerm = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.card');

            cards.forEach(card => {
                const title = card.querySelector('.card-title').textContent.toLowerCase();
                if (title.includes(searchTerm)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
});
