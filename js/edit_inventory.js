document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // --- Helpers ---
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    const inventoryId = getQueryParam('id');
    if (!inventoryId) {
        alert('No inventory ID specified.');
        window.location.href = 'inventories.html';
        return;
    }

    // --- Elements ---
    const form = document.getElementById('edit-inventory-form');
    const roomSelect = document.getElementById('room_id');

    // Status Elements
    const statusSelect = document.getElementById('status_condition');
    const availSelect = document.getElementById('availability_status');
    const remarksGroup = document.getElementById('remarks-group');
    const remarksInput = document.getElementById('remarks');

    // Split/Move Elements
    const splitUiGroup = document.getElementById('split-ui-group');
    const moveModeRadios = document.querySelectorAll('input[name="move_mode"]');
    const splitQtyGroup = document.getElementById('split-qty-input-group');
    const splitQtyInput = document.getElementById('split_quantity');
    const originalQtyDisplay = document.getElementById('original-qty-display');

    // User Assignment Elements
    const assignedUserGroup = document.getElementById('assigned-user-group');
    const usersChecklist = document.getElementById('users-checklist');
    // const assignedUserSelect = document.getElementById('assigned_user_id'); // Removed

    // Standard Inputs
    const nameInput = document.getElementById('inventory_name');
    const qtyInput = document.getElementById('quantity'); // Main Quantity (Hidden in split mode?) logic check
    const previewImg = document.getElementById('image-preview');
    const fileInput = document.getElementById('inventory_photo');
    const uploadWrapper = document.querySelector('.image-upload-wrapper');

    // State
    let originalData = {};

    // --- 1. Load Data Sequence ---
    // Load Rooms -> Load Users -> Load Inventory
    loadRooms()
        .then(() => loadUsers())
        .then(() => loadInventoryDetails(inventoryId));


    async function loadRooms() {
        try {
            const response = await fetch(CONFIG.apiUrl('/api/rooms'), {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            if (!response.ok) throw new Error('Failed to load rooms');
            const data = await response.json();
            roomSelect.innerHTML = '<option value="" disabled>Select a room</option>';
            data.forEach(r => {
                const opt = document.createElement('option');
                opt.value = r.id;
                opt.textContent = r.room_name;
                roomSelect.appendChild(opt);
            });
        } catch (e) { console.error(e); }
    }

    async function loadUsers() {
        try {
            const response = await fetch(CONFIG.apiUrl('/api/users/list'), {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            if (!response.ok) throw new Error('Failed to load users');
            const data = await response.json();
            userSelectDropdown.innerHTML = '<option value="">-- Select a User --</option>';

            if (data.length === 0) {
                // userSelectDropdown.disabled = true;
                return;
            }

            data.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u.id;
                opt.textContent = `${u.name} (${u.role})`;
                userSelectDropdown.appendChild(opt);
            });
        } catch (e) { console.error(e); }
    }

    async function loadInventoryDetails(id) {
        try {
            const response = await fetch(CONFIG.apiUrl(`/api/inventories/${id}`), {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            if (!response.ok) throw new Error('Failed to load inventory');
            const data = await response.json();

            // Store Original State
            originalData = {
                status: data.status_condition,
                avail: data.availability_status || 'AVAILABLE', // Default fallback
                qty: data.quantity,
                userId: data.assigned_user_id
            };

            // Populate Form
            nameInput.value = data.inventory_name;
            qtyInput.value = data.quantity;
            roomSelect.value = data.room_id;
            statusSelect.value = data.status_condition;
            availSelect.value = data.availability_status || 'AVAILABLE';
            remarksInput.value = data.remarks || '';

            // Pre-select users
            if (data.assigned_users && data.assigned_users.length > 0) {
                data.assigned_users.forEach(u => {
                    const qty = (u.pivot && u.pivot.quantity) ? u.pivot.quantity : 1;
                    assignedUsersData[u.id] = {
                        id: u.id,
                        name: u.firstname + ' ' + u.lastname, // Assuming api returns full user object or close enough
                        role: u.role,
                        quantity: qty
                    };
                });
            } else if (data.assigned_user_id) { // Fallback (Legacy)
                // We'd need to fetch user name or ignore. 
                // Given we loaded users list, we might match ID?
                // For now, assume modern structure.
            }
            renderUserRows();

            originalQtyDisplay.textContent = data.quantity;

            // Image
            if (data.inventory_photo) {
                let photoUrl = data.inventory_photo;
                if (!photoUrl.startsWith('http')) {
                    const path = photoUrl.startsWith('/') ? photoUrl.substring(1) : photoUrl;
                    if (path.includes('storage')) photoUrl = CONFIG.apiUrl('/' + path);
                    else if (path.startsWith('images/')) photoUrl = CONFIG.apiUrl('/' + path);
                    else photoUrl = CONFIG.apiUrl('/storage/' + path);
                }
                previewImg.src = photoUrl;
            }

            // Initial UI Update
            updateUI();

        } catch (error) {
            console.error(error);
            alert('Error loading inventory data.');
            window.location.href = 'inventories.html';
        }
    }

    // --- 2. Interactive Logic ---
    statusSelect.addEventListener('change', updateUI);
    availSelect.addEventListener('change', updateUI);

    moveModeRadios.forEach(radio => {
        radio.addEventListener('change', updateUI);
    });

    function updateUI() {
        const currentStatus = statusSelect.value;
        const currentAvail = availSelect.value;

        // A. Toggle Remarks
        if (currentStatus === 'NEEDS ATTENTION' || currentStatus === 'N.G') {
            remarksGroup.style.display = 'block';
        } else {
            remarksGroup.style.display = 'none';
        }

        // B. Toggle Assigned User (IN USE only)
        if (currentAvail === 'IN USE') {
            assignedUserGroup.style.display = 'block';
        } else {
            assignedUserGroup.style.display = 'none';
        }

        // D. Split Logic (Hidden but Functional)
        // We will default to split mode internally if assignments < total
        // But visual "Split UI Group" is hidden as per user request.
        splitUiGroup.style.display = 'none';
        splitQtyGroup.style.display = 'none'; // Ensure this is hidden

        // Ensure split_quantity input is always enabled for programmatic update
        splitQtyInput.removeAttribute('required'); // We manually validate
        splitQtyInput.readOnly = false;
    }

    // --- Dynamic User Assignment Logic ---
    const userSelectDropdown = document.getElementById('user-select-dropdown');
    const addUserBtn = document.getElementById('add-user-btn');
    const usersListContainer = document.getElementById('users-assignment-list');
    const noUsersMsg = document.getElementById('no-users-msg');

    // Store selected users in memory: { userId: { name, quantity, role } }
    let assignedUsersData = {};

    function renderUserRows() {
        usersListContainer.innerHTML = '';
        const ids = Object.keys(assignedUsersData);

        if (ids.length === 0) {
            usersListContainer.appendChild(noUsersMsg);
            noUsersMsg.style.display = 'block';
        } else {
            noUsersMsg.style.display = 'none';
            ids.forEach(id => {
                const u = assignedUsersData[id];
                const row = document.createElement('div');
                row.className = 'user-assign-row';
                row.style.display = 'flex';
                row.style.alignItems = 'center';
                row.style.gap = '0.5rem';
                row.style.padding = '0.5rem';
                row.style.backgroundColor = '#f3f4f6';
                row.style.borderRadius = '0.375rem';

                row.innerHTML = `
                    <div style="flex-grow:1; font-weight:500; font-size:0.9rem;">${u.name} <span style="color:#6b7280; font-size:0.8rem;">(${u.role})</span></div>
                    <div style="display:flex; align-items:center; gap:0.25rem;">
                        <span style="font-size:0.8rem; color:#4b5563;">Qty:</span>
                        <input type="number" class="user-qty-input" data-userid="${id}" value="${u.quantity}" min="1" style="width: 3rem; padding: 0.25rem; border: 1px solid #d1d5db; border-radius: 0.25rem; text-align:center;">
                    </div>
                    <button type="button" class="remove-user-btn" data-userid="${id}" style="color:#ef4444; background:none; border:none; cursor:pointer; padding:0.25rem;">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                `;
                usersListContainer.appendChild(row);
            });

            // Re-attach listeners
            document.querySelectorAll('.user-qty-input').forEach(input => {
                input.addEventListener('input', (e) => {
                    const uid = e.target.dataset.userid;
                    const val = parseInt(e.target.value) || 0;
                    if (assignedUsersData[uid]) {
                        assignedUsersData[uid].quantity = val;
                        updateTotalQuantity();
                    }
                });
            });

            document.querySelectorAll('.remove-user-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const uid = e.target.closest('button').dataset.userid;
                    delete assignedUsersData[uid];
                    renderUserRows();
                    updateTotalQuantity();
                });
            });
        }
        updateTotalQuantity();
    }

    function updateTotalQuantity() {
        let totalAssigned = 0;
        Object.values(assignedUsersData).forEach(u => totalAssigned += u.quantity);

        const currentAvail = availSelect.value;
        const totalOriginal = parseInt(originalData.qty) || 0;

        if (currentAvail === 'IN USE') {
            // Logic: 
            // - Update Hidden Split Qty Input with `totalAssigned`.
            // - Update Main `qty` Input to show `Remaining` (Original - Assigned).
            // - Switch Radio Mode: 
            //    - If totalAssigned < totalOriginal: Mode = Split.
            //    - If totalAssigned == totalOriginal: Mode = All.
            //    - If totalAssigned > totalOriginal: Warn? We assume User logic overrides.

            splitQtyInput.value = totalAssigned;

            const remaining = totalOriginal - totalAssigned;
            qtyInput.value = remaining >= 0 ? remaining : 0;

            // Auto Mode Switch
            if (totalAssigned > 0 && totalAssigned < totalOriginal) {
                document.querySelector('input[name="move_mode"][value="split"]').checked = true;
            } else {
                document.querySelector('input[name="move_mode"][value="all"]').checked = true;
            }
        } else {
            // If NOT in use, just show full original or user edit?
            if (qtyInput.value == 0) qtyInput.value = totalOriginal;
        }
    }

    addUserBtn.addEventListener('click', () => {
        const uid = userSelectDropdown.value;
        if (!uid) return;

        if (assignedUsersData[uid]) {
            alert('User already added.');
            return;
        }

        const option = userSelectDropdown.options[userSelectDropdown.selectedIndex];
        assignedUsersData[uid] = {
            id: uid,
            name: option.text, // Contains Name (Role)
            role: '', // Extracted from text or ignored
            quantity: 1
        };
        renderUserRows();
        // Reset dropdown
        userSelectDropdown.value = '';
    });


    // Image Upload
    uploadWrapper.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => previewImg.src = e.target.result;
            reader.readAsDataURL(file);
        }
    });

    // --- 3. Submission ---
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // N.G. Validation Block
        const currentStatus = statusSelect.value;
        const currentAvail = availSelect.value;
        if (currentStatus === 'N.G' && currentAvail !== 'NOT AVAILABLE') {
            alert("You cannot make this item available for use.");
            return;
        }

        // Validate Assigned Users if IN USE
        let assignedUsersPayload = [];
        if (currentAvail === 'IN USE') {
            const ids = Object.keys(assignedUsersData);
            if (ids.length === 0) {
                alert("Please add at least one user who is using this item.");
                return;
            }
            assignedUsersPayload = Object.values(assignedUsersData).map(u => ({
                user_id: u.id,
                quantity: u.quantity
            }));

            // Check totals
            let assignedTotal = 0;
            assignedUsersPayload.forEach(p => assignedTotal += p.quantity);
            if (assignedTotal <= 0) {
                alert("Total assigned quantity must be greater than 0.");
                return;
            }
        }

        const formData = new FormData(form);
        formData.append('_method', 'PUT');

        // Append structured users data
        formData.append('assigned_users', JSON.stringify(assignedUsersPayload));

        // Check Split Mode parameters
        const moveMode = document.querySelector('input[name="move_mode"]:checked').value;
        if (moveMode === 'split') {
            // split_quantity is in form
        } else {
            formData.delete('split_quantity');
        }

        try {
            const response = await fetch(CONFIG.apiUrl(`/api/inventories/${inventoryId}`), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                alert('Inventory updated successfully!');
                window.location.href = 'inventories.html';
            } else {
                let errData;
                try {
                    errData = await response.json();
                } catch (e) {
                    errData = { message: 'Server returned an invalid response. Please check server logs.' };
                }
                console.error('Update failed:', errData);
                alert('Failed to update inventory: ' + (errData.message || 'Unknown error'));
            }

        } catch (error) {
            console.error(error);
            alert('An error occurred while updating.');
        }
    });

});
