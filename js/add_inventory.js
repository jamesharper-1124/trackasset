document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const form = document.getElementById('add-inventory-form');
    const roomSelect = document.getElementById('room-select');
    const statusSelect = document.getElementById('status_condition');
    const remarksGroup = document.getElementById('remarks-group');
    const previewImg = document.querySelector('.image-preview');
    const fileInput = document.querySelector('.file-input-hidden');
    const uploadWrapper = document.querySelector('.image-upload-wrapper');

    // 1. Fetch Rooms for Select Dropdown
    const roomsUrl = CONFIG.apiUrl('/api/rooms/data');
    console.log('[DEBUG] Fetching rooms from:', roomsUrl);

    $.ajax({
        url: roomsUrl,
        method: 'GET',
        success: function (data) {
            console.log('[DEBUG] Rooms data received:', data);

            roomSelect.innerHTML = '<option value="" disabled selected>Select a room</option>';

            // Safety check for data structure
            if (!data || !data.currentUser) {
                console.error('[ERROR] Unexpected API response structure:', data);
                roomSelect.innerHTML = '<option value="" disabled>Error: Invalid Data</option>';
                return;
            }

            let allRooms = [];
            const role = data.currentUser.role;

            if (role === 'admin') {
                // Combine lists for Admin
                const assigned = data.assignedRooms || [];
                const available = data.availableRooms || [];
                console.log('[DEBUG] Admin lists - Assigned:', assigned.length, 'Available:', available.length);

                allRooms = [...assigned, ...available];

                // Deduplicate by ID
                allRooms = [...new Map(allRooms.map(item => [item.id, item])).values()];
            } else {
                // Staff only assigned rooms
                // Users technically shouldn't be adding inventories, but if they could, they'd see assigned? 
                // Let's assume Staff/User logic is similar for "My Rooms" if we wanted to support it.
                // But inventories.js says Users don't add.
                console.log('[DEBUG] Staff/User list - Assigned:', (data.assignedRooms || []).length);
                allRooms = data.assignedRooms || [];
            }

            console.log('[DEBUG] Final room list count:', allRooms.length);

            if (allRooms.length === 0) {
                const option = document.createElement('option');
                option.disabled = true;
                option.textContent = "No rooms available (Assigned only)";
                roomSelect.appendChild(option);
            } else {
                allRooms.forEach(room => {
                    const option = document.createElement('option');
                    option.value = room.id;
                    option.textContent = room.room_name;
                    roomSelect.appendChild(option);
                });
            }
        },
        error: function (xhr) {
            console.error('[ERROR] Error fetching rooms:', xhr);
            roomSelect.innerHTML = '<option value="" disabled>Error loading rooms (' + xhr.status + ')</option>';
        }
    });

    // 2. Toggle Remarks Logic
    if (statusSelect) {
        statusSelect.addEventListener('change', function () {
            const val = this.value;
            if (val === 'NEEDS ATTENTION' || val === 'N.G') {
                remarksGroup.style.display = 'block';
            } else {
                remarksGroup.style.display = 'none';
            }
        });
    }

    // 3. Image Preview Logic
    if (uploadWrapper && fileInput) {
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
    }

    // 4. Form Submission
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // Basic client-side validation
            if (roomSelect.value === "") {
                alert("Please select a room.");
                return;
            }

            const formData = new FormData(this);

            $.ajax({
                url: CONFIG.apiUrl('/api/inventories'),
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (response) {
                    alert('Inventory item added successfully!');
                    window.location.href = 'inventories.html';
                },
                error: function (xhr) {
                    let msg = 'Failed to add inventory.';
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        msg = 'Error: ' + xhr.responseJSON.message;
                    } else if (xhr.responseText) {
                        // Try to parse text just in case
                        try {
                            const parsed = JSON.parse(xhr.responseText);
                            if (parsed.message) msg = 'Error: ' + parsed.message;
                        } catch (e) { }
                    }
                    alert(msg);
                    console.error('[ERROR] Submit failed:', xhr);
                }
            });
        });
    }
});
