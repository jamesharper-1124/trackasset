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
            usersChecklist.innerHTML = '';

            if (data.length === 0) {
                usersChecklist.innerHTML = '<div style="color:#6b7280; font-size:0.9rem;">No users found.</div>';
                return;
            }

            data.forEach(u => {
                const div = document.createElement('div');
                div.style.marginBottom = '0.25rem';

                const label = document.createElement('label');
                label.style.display = 'flex';
                label.style.alignItems = 'center';
                label.style.cursor = 'pointer';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.name = 'assigned_user_ids[]';
                checkbox.value = u.id;
                checkbox.style.marginRight = '0.5rem';

                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(`${u.name} (${u.role})`));
                div.appendChild(label);
                usersChecklist.appendChild(div);
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
                // Collect IDs
                const assignedIds = new Set(data.assigned_users.map(u => parseInt(u.id)));

                // Tick checkboxes
                const checkboxes = usersChecklist.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(cb => {
                    if (assignedIds.has(parseInt(cb.value))) {
                        cb.checked = true;
                    }
                });
            } else if (data.assigned_user_id) { // Fallback for old single-user data
                const checkboxes = usersChecklist.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(cb => {
                    if (parseInt(cb.value) === parseInt(data.assigned_user_id)) {
                        cb.checked = true;
                    }
                });
            }

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
            // assignedUserSelect.setAttribute('required', 'required'); // Logic moved to submit
        } else {
            assignedUserGroup.style.display = 'none';
            // assignedUserSelect.removeAttribute('required');
        }

        // C. N.G Validation Warning (Visual)
        if (currentStatus === 'N.G' && currentAvail !== 'NOT AVAILABLE') {
            // We can auto-switch or just warn. User logic says "Prompt".
            // We'll let submit handle the hard block, but maybe auto-set NOT AVAILABLE to be helpful?
            // availSelect.value = 'NOT AVAILABLE'; // Auto-fix?
            // User requested "Prompt", usually implies Alert on action. We'll leave it for Submit validation.
        }

        // D. Split Logic
        // Check if Status OR Avail changed
        const hasStatusChange = (currentStatus !== originalData.status) || (currentAvail !== originalData.avail);
        const isMultiQty = (parseInt(originalData.qty) > 1);

        if (hasStatusChange && isMultiQty) {
            splitUiGroup.style.display = 'block';
        } else {
            splitUiGroup.style.display = 'none';
            // Reset radio to 'all' if hiding
            document.querySelector('input[name="move_mode"][value="all"]').checked = true;
        }

        // Check Move Mode
        const moveMode = document.querySelector('input[name="move_mode"]:checked').value;
        if (moveMode === 'split') {
            splitQtyGroup.style.display = 'block';
            splitQtyInput.setAttribute('required', 'required');
            splitQtyInput.setAttribute('max', originalData.qty - 1); // Cannot move ALL (that's just 'apply to all')
        } else {
            splitQtyGroup.style.display = 'none';
            splitQtyInput.removeAttribute('required');
            splitQtyInput.value = '';
        }
    }

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
            alert("You cannot make this item available for use.");
            return;
        }

        // Validate Assigned Users if IN USE
        if (currentAvail === 'IN USE') {
            const checkedBoxes = usersChecklist.querySelectorAll('input[type="checkbox"]:checked');
            if (checkedBoxes.length === 0) {
                alert("Please select at least one user who is using this item.");
                return;
            }
        }

        const formData = new FormData(form);
        formData.append('_method', 'PUT');

        // Check Split Mode
        const moveMode = document.querySelector('input[name="move_mode"]:checked').value;
        if (moveMode === 'split') {
            // split_quantity is already in formData from the input
            // validation is handled by 'required' and 'max' attrs
        } else {
            // If 'Apply to All', ensure we DO NOT send split_quantity
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
                const errData = await response.json();
                console.error('Update failed:', errData);
                alert('Failed to update inventory: ' + (errData.message || 'Unknown error'));
            }

        } catch (error) {
            console.error(error);
            alert('An error occurred while updating.');
        }
    });

});
