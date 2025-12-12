document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('auth_token');

    // Auth Check
    if (!token) {
        window.location.href = 'login.html?error=session_expired';
        return;
    }

    const assignedContainer = document.getElementById('assigned-inventories-container');
    const assignedSection = document.getElementById('assigned-inventories-section');
    const availableContainer = document.getElementById('available-inventories-container');
    const searchInput = document.getElementById('inventory-search');
    const radioButtons = document.querySelectorAll('input[name="search-filter"]');

    // --------------------------------------------------------------------------
    // 1. Initial Data Fetch (Only on Index Page)
    // --------------------------------------------------------------------------
    if (assignedContainer || availableContainer) {
        fetchInventoriesData();
    }

    function fetchInventoriesData() {
        console.log('Fetching Inventories... Token:', token);

        // Using jQuery AJAX to leverage global auth-guard setup
        $.ajax({
            url: CONFIG.apiUrl('/api/inventories/data?t=' + new Date().getTime()),
            method: 'GET',
            success: function (data) {
                if (data) {
                    renderInventories(data);
                }
            },
            error: function (xhr) {
                console.error('Error loading inventories:', xhr);
                // 401 indicates session expired, handled by auth-guard.js
            }
        });
    }

    // --------------------------------------------------------------------------
    // 2. Rendering Logic
    // --------------------------------------------------------------------------
    function renderInventories(data) {
        if (!assignedContainer && !availableContainer) return;

        const { userInventories, availableInventories, currentUser } = data;

        console.log('[DEBUG] renderInventories data:', data);

        // Safety checks for currentUser
        if (!currentUser) {
            console.error('[ERROR] currentUser is missing from API response!');
            return;
        }

        const isAdmin = (currentUser.role === 'admin');
        const isUser = (currentUser.role === 'user');

        console.log('[DEBUG] Role:', currentUser.role, 'isAdmin:', isAdmin, 'isUser:', isUser);

        // Show "Add Inventory" button if not a basic user
        const addBtn = document.getElementById('add-inventory-btn');
        if (addBtn) {
            if (!isUser) {
                addBtn.style.display = 'inline-flex';
            } else {
                addBtn.style.display = 'none';
            }
        }

        // A. Assigned Inventories
        if (!isUser && assignedContainer) {
            assignedSection.style.display = 'block';
            assignedContainer.innerHTML = '';
            if (userInventories && userInventories.length > 0) {
                userInventories.forEach(item => {
                    assignedContainer.appendChild(createInventoryCard(item, true));
                });
            } else {
                assignedContainer.innerHTML = '<p style="color: #6b7280; font-style: italic;">No inventories assigned to your rooms.</p>';
            }
        }

        // B. Available Inventories
        if (availableContainer) {
            // UI Polish: For 'users' who see everything, rename header to "All Inventories"
            const titleEl = document.getElementById('available-inventories-title');
            if (titleEl) {
                titleEl.textContent = isUser ? 'All Inventories' : 'Available Inventories';
            }

            availableContainer.innerHTML = '';
            if (availableInventories && availableInventories.length > 0) {
                availableInventories.forEach(item => {
                    // Admins can edit everything. Staff can only edit 'assigned' items (handled in section A).
                    // In 'Available' (unassigned to them), Staff are Read-Only.
                    availableContainer.appendChild(createInventoryCard(item, isAdmin));
                });
            } else {
                availableContainer.innerHTML = '<p style="color: #6b7280; font-style: italic;">No other inventories available.</p>';
            }
        }

        if (searchInput && searchInput.value) {
            filterInventories();
        }
    }

    function createInventoryCard(item, canEdit) {
        const div = document.createElement('div');
        div.className = 'h-card';
        div.dataset.name = (item.inventory_name || '').toLowerCase();
        div.dataset.room = (item.room ? item.room.room_name : '').toLowerCase();
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

        const roomName = item.room ? item.room.room_name : 'Unassigned';

        let statusClass = 'status-good';
        if (item.status_condition === 'NEEDS ATTENTION') statusClass = 'status-fair';
        if (item.status_condition === 'N.G') statusClass = 'status-danger';

        let actionsHtml = '';
        if (canEdit) {
            actionsHtml = `
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
        } else {
            actionsHtml = '<span style="font-size: 0.75rem; color: #9ca3af; font-style: italic;">Read Only</span>';
        }

        div.innerHTML = `
            <div class="h-card-img-wrapper">
                <img src="${photoUrl}" alt="${item.inventory_name}">
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
                        <span class="remarks-text">Remarks: ${item.remarks || 'NONE'}</span>
                    </div>
                </div>
                <div class="h-card-actions">
                    ${actionsHtml}
                </div>
            </div>
        `;
        return div;
    }

    // --------------------------------------------------------------------------
    // 3. Search / Filter
    // --------------------------------------------------------------------------
    function filterInventories() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const filterRadio = document.querySelector('input[name="search-filter"]:checked');
        if (!filterRadio) return;

        const filterType = filterRadio.value;
        const cards = document.querySelectorAll('.h-card');

        cards.forEach(card => {
            let valueToCheck = '';
            switch (filterType) {
                case 'name': valueToCheck = card.dataset.name; break;
                case 'room': valueToCheck = card.dataset.room; break;
                case 'condition': valueToCheck = card.dataset.condition; break;
                default: valueToCheck = card.dataset.name;
            }

            if (valueToCheck.includes(searchTerm)) {
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

    // --------------------------------------------------------------------------
    // 4. Form Submission (Using Delegated Events & jQuery AJAX)
    // --------------------------------------------------------------------------

    // A. Delete Action (Delegated)
    // A. Delete Action (Delegated)
    $(document).on('click', '.delete-btn', function (e) {
        e.preventDefault();

        // STRICT SESSION CHECK
        const token = localStorage.getItem('auth_token');
        if (!token) {
            alert('Session Expired. Please log in again.');
            localStorage.removeItem('auth_token');
            window.location.href = 'login.html';
            return;
        }

        const id = $(this).data('id');
        if (!confirm('Are you sure you want to delete this inventory?')) return;

        $.ajax({
            url: CONFIG.apiUrl('/api/inventories/' + id),
            method: 'DELETE',
            success: function (response) {
                fetchInventoriesData(); // Refresh list
            },
            error: function (xhr) {
                console.error('Delete error:', xhr);
                // 401 is handled by global auth-guard
                if (xhr.status !== 401) {
                    alert('Failed to delete item.');
                }
            }
        });
    });

    // B. Create/Update Form Handling (Targeting #inventory-form usually found in Add/Edit pages)
    // Note: Add/Edit pages might need their own scripts or we can include them here if they share IDs.
    // Assuming standard form submission for now for add/edit pages if they are separate views. 
    // BUT we should genericize it.

    // B. Create/Update Form Handling
    // MOVED TO add_inventory.js and edit_inventory.js. 
    // This file should only handle the LIST/INDEX view logic.
    /*
    const inventoryForm = $('form[action*="inventories"]');
    if (inventoryForm.length > 0 && !inventoryForm.hasClass('delete-form')) {
       // Logic removed to prevent double-submission
    }
    */
});
