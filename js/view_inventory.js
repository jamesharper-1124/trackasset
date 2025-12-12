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
                pageTitle.textContent = `Inventories in ${data.room.room_name}`;
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
            card.className = 'card';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';

            // Image Handling
            // Image Handling
            let photoUrl = inv.inventory_photo || 'images/inventory/default.png';
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

            // Status Color
            let statusColor = '#10b981'; // green
            if (inv.status === 'Damaged') statusColor = '#ef4444'; // red
            if (inv.status === 'Lost') statusColor = '#f59e0b'; // amber

            card.innerHTML = `
                <div class="card-img-wrapper" style="position:relative;">
                    <span style="position:absolute; top:0.5rem; right:0.5rem; background-color:${statusColor}; color:white; padding:0.25rem 0.5rem; border-radius:9999px; font-size:0.75rem; font-weight:600;">
                        ${inv.status}
                    </span>
                    <img src="${photoUrl}" alt="${inv.item_name}" class="card-img" style="height:12rem; width:100%; object-fit:cover;" onerror="this.onerror=null; this.src='${CONFIG.apiUrl('/images/uploads/inventory/default.png')}';">
                </div>
                <div class="card-content" style="padding:1rem; flex:1;">
                    <h3 class="card-title" style="margin-bottom:0.5rem;">${inv.item_name}</h3>
                    <p style="font-size:0.875rem; color:#6b7280; margin-bottom:0.25rem;">SKU: ${inv.sku}</p>
                    <p style="font-size:0.875rem; color:#6b7280; margin-bottom:0.5rem;">Price: ₱${parseFloat(inv.price).toLocaleString()}</p>
                    <p style="font-size:0.875rem; color:#374151;">${inv.description || 'No description'}</p>
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
