document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room_id');

    if (!roomId) {
        alert('No Room ID specified.');
        window.location.href = 'rooms.html';
        return;
    }

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

    // Elements
    const pageTitle = document.getElementById('page-title');
    const roomHeader = document.getElementById('room-header'); // New sub-header
    const grid = document.getElementById('inventory-grid');
    const loading = document.getElementById('loading');
    const noData = document.getElementById('no-data');
    const searchInput = document.getElementById('inventory-search');
    const radioButtons = document.querySelectorAll('input[name="status-filter"]');

    // Global variables
    let currentUser = null;
    let currentRoom = null;

    // Fetch Data
    // We need two things:
    // 1. Current User Info (for permissions) -> from /api/inventories/data (or better endpoint if available, but this works)
    // 2. Room Data -> from /api/rooms/{id}

    // Helper to fetch user info first
    function fetchUserInfo() {
        return $.ajax({
            url: CONFIG.apiUrl('/api/inventories/data?t=' + new Date().getTime()),
            method: 'GET'
        });
    }

    // Helper to fetch room data
    function fetchRoomData() {
        return $.ajax({
            url: CONFIG.apiUrl(`/api/rooms/${roomId}`),
            method: 'GET'
        });
    }

    loading.style.display = 'block';

    // Execute both
    $.when(fetchUserInfo(), fetchRoomData())
        .done(function (userDataArgs, roomDataArgs) {
            loading.style.display = 'none';

            // userDataArgs[0] is the data object from the first call
            const userData = userDataArgs[0];
            const roomData = roomDataArgs[0];

            if (userData && userData.currentUser) {
                currentUser = userData.currentUser;
            }

            if (roomData && roomData.room) {
                currentRoom = roomData.room;
                // Update header
                if (roomHeader) {
                    roomHeader.textContent = `Inventories in ${currentRoom.room_name}`;
                }

                // Determine permissions
                // Logic derived from inventories.js:
                // Admin: Full access
                // Staff: Full access if Assigned (manager_id matches), Restricted if Available (not manager)
                // User: Read Only

                let isAdmin = false;
                let isStaff = false;
                let isManager = false;

                if (currentUser) {
                    isAdmin = (currentUser.role === 'admin');
                    isStaff = (currentUser.role === 'staff');
                    // Check if current user manages this room
                    // Assuming room object has manager_id or we compare IDs
                    // User object usually has id. Room has manager_id?
                    // Let's debug what roomData has.
                    // For now, if we don't have manager_id, we might default to restricted for staff.
                    // But usually API provides it.
                    if (currentUser.id) {
                        const userId = String(currentUser.id);

                        // Check direct manager_id
                        if (currentRoom.manager_id) {
                            isManager = (String(currentRoom.manager_id) === userId);
                        }

                        // Also check if 'managers' array exists (many-to-many)
                        if (!isManager && currentRoom.managers && Array.isArray(currentRoom.managers)) {
                            isManager = currentRoom.managers.some(m => String(m.id) === userId);
                        }
                    }
                }

                // Determine if actions should be restricted
                // If Admin: Not restricted.
                // If Staff: Restricted UNLESS isManager.
                // If User: Always read only (handled by createCard logic 'canEdit')

                let canEdit = isAdmin || (isStaff && isManager);
                let isRestricted = (isStaff && !isManager);

                // If it's a regular user, canEdit is false, so isRestricted doesn't matter (actions won't show)

                renderInventories(currentRoom.inventories || [], canEdit, isRestricted);
            } else {
                noData.style.display = 'block';
                noData.textContent = "Room not found or empty.";
            }

        })
        .fail(function (xhr) {
            loading.style.display = 'none';
            console.error('Error loading data:', xhr);
            if (xhr.status === 401) {
                window.location.href = 'login.html'; // Auth guard ensures this mostly
            } else {
                noData.style.display = 'block';
                noData.textContent = "Error loading data.";
            }
        });

    function renderInventories(inventories, canEdit, isRestricted) {
        grid.innerHTML = '';
        if (!inventories || inventories.length === 0) {
            noData.style.display = 'block';
            return;
        }
        noData.style.display = 'none';

        inventories.forEach(item => {
            grid.appendChild(createInventoryCard(item, canEdit, isRestricted));
        });
    }

    // Exact copy of createInventoryCard from inventories.js
    function createInventoryCard(item, canEdit, isRestricted = false) {
        const div = document.createElement('div');
        div.className = 'h-card';
        div.dataset.name = (item.inventory_name || '').toLowerCase();
        div.dataset.room = (item.room ? item.room.room_name : (currentRoom ? currentRoom.room_name : '')).toLowerCase();
        div.dataset.condition = (item.status_condition || '').toLowerCase();

        let photoUrl = item.inventory_photo || 'images/inventory/default.png';
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

        const roomName = item.room ? item.room.room_name : (currentRoom ? currentRoom.room_name : 'Unassigned');

        let statusClass = 'status-good';
        if (item.status_condition === 'NEEDS ATTENTION') statusClass = 'status-fair';
        if (item.status_condition === 'N.G') statusClass = 'status-danger';

        let actionsHtml = '';

        // Report Button (Always Visible)
        const reportBtn = `
            <a href="add_report.html?inventory_id=${item.id}" class="btn-icon-action report" title="Report Issue" style="color: #ef4444;">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
            </a>
        `;

        if (canEdit && !isRestricted) {
            // Normal Edit/Delete for Owners/Admins
            actionsHtml = `
                ${reportBtn}
                <a href="edit_inventory.html?id=${item.id}" class="btn-icon-action edit" title="Edit">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </a>
                <button type="button" class="btn-icon-action delete delete-btn" data-id="${item.id}" title="Delete">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            `;
        } else if (isRestricted) {
            // RESTRICTED EDIT for Staff on Available items
            actionsHtml = `
                ${reportBtn}
                <a href="#" class="btn-icon-action edit restricted-action" title="Edit">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </a>
                <button type="button" class="btn-icon-action delete restricted-action" title="Delete">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            `;
        } else {
            // Read Only users
            actionsHtml = `
                ${reportBtn}
            `;
        }

        div.innerHTML = `
            <div class="h-card-img-wrapper">
                <img src="${photoUrl}" alt="${item.inventory_name}" onerror="this.onerror=null; this.src='images/inventory/default.png';">
            </div>
            <div class="h-card-content">
                <div class="h-card-info">
                    <h4 class="h-card-title">${item.inventory_name}</h4>
                    <div class="h-card-meta">
                        <span class="meta-item">
                             <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                            ${roomName}
                        </span>
                        <span class="meta-item">
                             <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                            </svg>
                            Qty: ${item.quantity}
                        </span>
                    </div>
                    <div class="status-wrapper">
                        <span class="card-status ${statusClass}">${item.status_condition}</span>
                    </div>
                    <div class="remarks-wrapper">
                         <div style="overflow: hidden; white-space: nowrap;">
                            <span class="remarks-text" style="display: inline-block; padding-left: 0; animation: marquee 10s linear infinite;">Remarks: ${item.remarks || 'NONE'}</span>
                         </div>
                         <style>
                            @keyframes marquee {
                                0% { transform: translateX(100%); }
                                100% { transform: translateX(-100%); }
                            }
                         </style>
                    </div>
                </div>
                <div class="h-card-actions">
                    ${actionsHtml}
                </div>
            </div>
        `;
        return div;
    }

    // Filter Logic
    function filterInventories() {
        const searchTerm = searchInput.value.toLowerCase();
        // view_inventory.html had 'status-filter', inventories.html has 'search-filter'.
        // We should check what the HTML has.
        // Step 143 showed view_inventory.html has name="status-filter".
        // To be SAFE, we will support status-filter radios here properly for this page.

        const selectedStatusRadio = document.querySelector('input[name="status-filter"]:checked');
        const selectedStatus = selectedStatusRadio ? selectedStatusRadio.value : 'all';

        const cards = document.querySelectorAll('.h-card');
        cards.forEach(card => {
            const name = card.dataset.name;
            const condition = card.dataset.condition; // 'good', 'needs attention', 'n.g'

            // Matches Search
            const matchesSearch = name.includes(searchTerm);

            // Matches Status
            // view_inventory.html values: 'all', 'Good', 'Needs Attention', 'N.G'
            // card.dataset.condition: 'good', 'needs attention', 'n.g' (lowercased)

            let matchesStatus = (selectedStatus === 'all');
            if (!matchesStatus) {
                matchesStatus = (condition === selectedStatus.toLowerCase());
            }

            if (matchesSearch && matchesStatus) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterInventories);
    }

    if (radioButtons) {
        radioButtons.forEach(radio => {
            radio.addEventListener('change', filterInventories);
        });
    }

    // Event Delegation (Matches inventories.js)
    $(document).on('click', '.restricted-action', function (e) {
        e.preventDefault();
        e.stopPropagation();
        alert("You cannot edit somebody else's inventory.");
    });

    $(document).on('click', '.delete-btn', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        if (!confirm('Are you sure you want to delete this inventory?')) return;

        // Use CONFIG.apiUrl
        $.ajax({
            url: CONFIG.apiUrl('/api/inventories/' + id),
            method: 'DELETE',
            success: function () {
                location.reload();
            },
            error: function () {
                alert('Failed to delete item.');
            }
        });
    });
});
