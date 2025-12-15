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

    let allInventories = [];

    // Fetch Data
    $.ajax({
        url: CONFIG.apiUrl(`/api/rooms/${roomId}`),
        method: 'GET',
        success: function (data) {
            loading.style.display = 'none';
            if (data && data.room) {
                // Update sub-header instead of main title
                if (roomHeader) {
                    roomHeader.textContent = `Available Inventories (in ${data.room.room_name})`;
                }

                if (data.room.inventories && data.room.inventories.length > 0) {
                    allInventories = data.room.inventories;
                    renderInventories(allInventories);
                } else {
                    noData.style.display = 'block';
                }
            }
        },
        error: function (xhr) {
            loading.textContent = 'Error loading data.';
            console.error(xhr);
            if (xhr.status === 401) window.location.href = 'login.html';
        }
    });

    function renderInventories(inventories) {
        grid.innerHTML = '';
        if (inventories.length === 0) {
            noData.style.display = 'block';
            return;
        }
        noData.style.display = 'none';

        inventories.forEach(inv => {
            const card = document.createElement('div');
            card.className = 'h-card';
            // Data attributes for filtering if needed later
            card.dataset.name = (inv.inventory_name || '').toLowerCase();
            card.dataset.condition = (inv.status_condition || '').toLowerCase();

            // Robust Image Logic
            let photoUrl = inv.inventory_photo;
            const localDefault = 'images/inventory/default.png';

            if (!photoUrl || photoUrl.includes('default.png')) {
                photoUrl = localDefault;
            } else if (!photoUrl.startsWith('http')) {
                let path = photoUrl.startsWith('/') ? photoUrl.substring(1) : photoUrl;
                if (path.includes('storage')) {
                    photoUrl = CONFIG.apiUrl('/' + path);
                } else if (path.startsWith('images/')) {
                    photoUrl = CONFIG.apiUrl('/' + path);
                } else {
                    photoUrl = CONFIG.apiUrl('/storage/' + path);
                }
            }

            // Status Styling
            let statusClass = 'status-good';
            if (inv.status_condition === 'NEEDS ATTENTION') statusClass = 'status-fair';
            if (inv.status_condition === 'N.G') statusClass = 'status-danger';

            card.innerHTML = `
                <div class="h-card-img-wrapper">
                    <img src="${photoUrl}" alt="${inv.inventory_name}" onerror="this.onerror=null; this.src='${localDefault}';">
                </div>
                <div class="h-card-content">
                    <div class="h-card-info">
                        <h4 class="h-card-title">${inv.inventory_name}</h4>
                        <div class="h-card-meta">
                             <span class="meta-item">
                                 <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                                </svg>
                                Qty: ${inv.quantity}
                            </span>
                        </div>
                        <div class="status-wrapper">
                            <span class="card-status ${statusClass}">${inv.status_condition}</span>
                        </div>
                        <div class="remarks-wrapper">
                             <div style="overflow: hidden; white-space: nowrap;">
                                <span class="remarks-text" style="display: inline-block; padding-left: 0; animation: marquee 10s linear infinite;">Remarks: ${inv.remarks || 'NONE'}</span>
                             </div>
                             <style>
                                @keyframes marquee {
                                    0% { transform: translateX(100%); }
                                    100% { transform: translateX(-100%); }
                                }
                             </style>
                        </div>
                    </div>
                    <!-- No Actions for View Only page typically, or add if needed -->
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // Filter Logic
    function filterInventories() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedStatus = document.querySelector('input[name="status-filter"]:checked').value;

        const filtered = allInventories.filter(inv => {
            const matchesSearch = inv.item_name.toLowerCase().includes(searchTerm) || inv.sku.toLowerCase().includes(searchTerm);
            const matchesStatus = selectedStatus === 'all' || inv.status === selectedStatus;
            return matchesSearch && matchesStatus;
        });

        renderInventories(filtered);
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterInventories);
    }

    radioButtons.forEach(radio => {
        radio.addEventListener('change', filterInventories);
    });
});
