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
    const statusSelect = document.getElementById('status_condition');
    const remarksGroup = document.getElementById('remarks-group');
    const remarksInput = document.getElementById('remarks');

    const nameInput = document.getElementById('inventory_name');
    const qtyInput = document.getElementById('quantity');
    const previewImg = document.getElementById('image-preview');
    const fileInput = document.getElementById('inventory_photo');
    const uploadWrapper = document.querySelector('.image-upload-wrapper');

    // --- 1. Load Rooms & Data ---
    loadRooms().then(() => {
        loadInventoryDetails(inventoryId);
    });

    async function loadRooms() {
        try {
            const response = await fetch(CONFIG.apiUrl('/api/rooms'), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to load rooms');
            const data = await response.json();

            // Populate select
            roomSelect.innerHTML = '<option value="" disabled>Select a room</option>';
            data.forEach(room => {
                const opt = document.createElement('option');
                opt.value = room.id;
                opt.textContent = room.room_name;
                roomSelect.appendChild(opt);
            });
        } catch (error) {
            console.error(error);
            alert('Error loading rooms.');
        }
    }

    async function loadInventoryDetails(id) {
        try {
            const response = await fetch(CONFIG.apiUrl(`/api/inventories/${id}`), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to load inventory details');
            const data = await response.json();

            // Populate Form
            nameInput.value = data.inventory_name;
            qtyInput.value = data.quantity;
            roomSelect.value = data.room_id; // Will match loaded rooms
            statusSelect.value = data.status_condition;
            remarksInput.value = data.remarks || '';

            // Handle Image
            if (data.inventory_photo) {
                let photoUrl = data.inventory_photo;
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

            // Handle Remarks visibility
            toggleRemarks();

        } catch (error) {
            console.error(error);
            alert('Error loading inventory data.');
            window.location.href = 'inventories.html';
        }
    }

    // --- 2. Interactive Logic ---

    // Status Logic
    statusSelect.addEventListener('change', toggleRemarks);

    function toggleRemarks() {
        const val = statusSelect.value;
        if (val === 'NEEDS ATTENTION' || val === 'N.G') {
            remarksGroup.style.display = 'block';
        } else {
            remarksGroup.style.display = 'none';
        }
    }

    // Image Preview Logic
    uploadWrapper.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                previewImg.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    });


    // --- 3. Submission ---
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = new FormData(form);
        // Add _method for PUT if backend requires it (Laravel standard for multipart PUT)
        formData.append('_method', 'PUT');

        try {
            const response = await fetch(CONFIG.apiUrl(`/api/inventories/${inventoryId}`), {
                method: 'POST', // Use POST with _method=PUT
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Do NOT set Content-Type header for FormData, browser does it with boundary
                },
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
            console.error('Error submitting form:', error);
            alert('An error occurred while updating.');
        }
    });

});
