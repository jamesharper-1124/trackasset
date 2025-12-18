document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = '/login?error=session_expired';
        return;
    }

    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const dropdownBtn = document.getElementById('dropdown-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');

    // Sidebar Toggle
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            console.log('Dashboard: Sidebar Toggle Clicked');
            sidebar.classList.toggle('show');
            sidebarOverlay.classList.toggle('show');
        });
    } else {
        console.warn('Dashboard: Sidebar Toggle Not Found');
    }

    // Close Sidebar on Overlay Click
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function () {
            console.log('Dashboard: Sidebar Overlay Clicked');
            sidebar.classList.remove('show');
            sidebarOverlay.classList.remove('show');
        });
    }

    // Dropdown Toggle
    if (dropdownBtn && dropdownMenu) {
        dropdownBtn.addEventListener('click', function (e) {
            console.log('Dashboard: Dropdown Clicked');
            e.stopPropagation();
            dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.style.display = 'none';
            }
        });
    } else {
        if (!dropdownBtn) console.warn('Dashboard: Dropdown Button Not Found');
        if (!dropdownMenu) console.warn('Dashboard: Dropdown Menu Not Found');
    }

    // --------------------------------------------------------------------------
    // Dashboard Data Fetching (AJAX)
    // --------------------------------------------------------------------------
    const dashboardDataUrl = CONFIG.apiUrl('/api/dashboard/data'); // Adjust if route usage differs

    // Only fetch if we are actually on the dashboard (check for an element unique to it)
    // We check for the admin view container or any other dashboard specific element
    if (document.getElementById('admin-view') || document.getElementById('chart-circle')) {
        fetchDashboardData();
    }

    function fetchDashboardData() {
        console.log('Fetching Data... Token:', localStorage.getItem('auth_token')); // DEBUG
        $.ajax({
            url: dashboardDataUrl,
            method: 'GET',
            // Headers are automatically handled by auth-guard.js $.ajaxSetup
            success: function (data) {
                if (data) {
                    renderDashboard(data);
                }
            },
            error: function (xhr) {
                console.error('Error loading dashboard data:', xhr);
                // 401 errors are handled globally by auth-guard.js
            }
        });
    }

    function renderDashboard(data) {
        const role = data.role || 'user'; // Default to user if undefined
        
        // Hide all views first
        $('#admin-view').hide();
        $('#staff-view').hide();
        $('#user-view').hide();

        if (role === 'admin') {
            $('#admin-view').show();
            renderAdminDashboard(data);
        } else if (role === 'staff') {
            $('#staff-view').show();
            renderStaffDashboard(data);
        } else {
            $('#user-view').show();
            renderUserDashboard(data);
        }
    }

    function renderAdminDashboard(data) {
        // --- Calculate Stats for Top Row ---
        const stats = data.stats || {};
        const total = data.totalInventories || 0;

        // 1. GOOD (Green)
        const goodCount = (stats['GOOD'] || 0) + (stats['Good Condition'] || 0);

        // 2. ATTENTION (Yellow) - Needs Attention / Repair
        const attentionCount = (stats['NEEDS ATTENTION'] || 0) + (stats['Needs Attention Condition'] || 0) + (stats['Needs Repair'] || 0);

        // 3. NOT GOOD (Red) - Broken / N.G.
        const ngCount = (stats['N.G'] || 0) + (stats['N.G. Condition'] || 0) + (stats['Broken'] || 0);

        // Update Top Stats Text
        const statTotal = document.getElementById('stat-total-assets');
        if (statTotal) statTotal.textContent = total;

        const statAttention = document.getElementById('stat-attention');
        if (statAttention) statAttention.textContent = attentionCount;

        const statGood = document.getElementById('stat-good');
        if (statGood) statGood.textContent = goodCount;

        const statNG = document.getElementById('stat-ng');
        if (statNG) statNG.textContent = ngCount;


        // 1. New Inventories (Recent Activity)
        const inventoryBody = document.getElementById('new-inventories-body');
        if (inventoryBody) {
            inventoryBody.innerHTML = '';
            if (data.newInventories && data.newInventories.length > 0) {
                data.newInventories.forEach(item => {
                    const tr = document.createElement('tr');
                    const date = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                    tr.innerHTML = `
                        <td class="font-medium text-dark">${item.inventory_name}</td>
                        <td class="text-secondary">${date}</td>
                    `;
                    inventoryBody.appendChild(tr);
                });
            } else {
                inventoryBody.innerHTML = '<tr><td colspan="2" class="text-secondary text-center" style="padding:1rem;">No recent inventories</td></tr>';
            }
        }

        // 2. New Users
        const usersList = document.getElementById('new-users-list');
        const usersCard = document.getElementById('card-new-users');

        if (usersList) {
            usersList.innerHTML = '';
            if (data.newUsers && data.newUsers.length > 0) {
                if (usersCard) usersCard.style.display = 'block';

                data.newUsers.forEach(user => {
                    const li = document.createElement('li');
                    li.className = 'user-item';
                    const role = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User';
                    li.innerHTML = `
                        <span class="font-medium text-dark">${user.firstname} ${user.lastname}</span>
                        <span class="user-role">${role}</span>
                    `;
                    usersList.appendChild(li);
                });
            } else {
                if (usersCard) usersCard.style.display = 'none';
            }
        }

        // 3. Problem Inventories (Critical Issues)
        const problemsBody = document.getElementById('problem-inventories-body');
        if (problemsBody) {
            problemsBody.innerHTML = '';
            if (data.problemInventories && data.problemInventories.length > 0) {
                data.problemInventories.forEach(report => {
                    const tr = document.createElement('tr');
                    const invName = report.inventory ? report.inventory.inventory_name : 'Previously Deleted';
                    tr.innerHTML = `
                        <td class="font-medium text-dark">${invName}</td>
                        <td class="text-red-600 font-medium">${report.remarks}</td>
                     `;
                    problemsBody.appendChild(tr);
                });
            } else {
                problemsBody.innerHTML = '<tr><td colspan="2" class="text-secondary text-center" style="padding:1rem;">No issues reported</td></tr>';
            }
        }

        // 4. Chart Statistics
        renderChart(data, goodCount, attentionCount, ngCount, total);
    }

    function renderStaffDashboard(data) {
        // --- Card 1: Stats ---
        const stats = data.myStats || {};
        const total = data.totalOwnedInventories || 0;
        const good = (stats['GOOD'] || 0) + (stats['Good Condition'] || 0);
        const attention = (stats['NEEDS ATTENTION'] || 0) + (stats['Needs Attention Condition'] || 0) + (stats['Needs Repair'] || 0);
        const ng = (stats['N.G'] || 0) + (stats['N.G. Condition'] || 0) + (stats['Broken'] || 0);

        $('#staff-total-assets').text(total);
        $('#staff-good').text(good);
        $('#staff-attention').text(attention);
        $('#staff-ng').text(ng);

        // --- Card 2: Assigned Rooms ---
        const roomsBody = document.getElementById('staff-rooms-body');
        if (roomsBody) {
            roomsBody.innerHTML = '';
            if (data.assignedRooms && data.assignedRooms.length > 0) {
                data.assignedRooms.forEach(room => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="font-medium text-dark">${room.room_name}</td>
                        <td class="text-center"><span class="badge badge-blue">${room.inventories_count}</span></td>
                    `;
                    roomsBody.appendChild(tr);
                });
            } else {
                roomsBody.innerHTML = '<tr><td colspan="2" class="text-secondary text-center">No assigned rooms</td></tr>';
            }
        }

        // --- Card 3: Recent Inventories (In My Rooms) ---
        const recentBody = document.getElementById('staff-recent-body');
        if (recentBody) {
            recentBody.innerHTML = '';
            if (data.recentInventories && data.recentInventories.length > 0) {
                data.recentInventories.forEach(item => {
                    const tr = document.createElement('tr');
                    const statusClass = item.status_condition === 'GOOD' ? 'text-green-600' : 'text-yellow-600';
                    tr.innerHTML = `
                        <td class="font-medium text-dark">${item.inventory_name}</td>
                        <td class="${statusClass}">${item.status_condition}</td>
                    `;
                    recentBody.appendChild(tr);
                });
            } else {
                recentBody.innerHTML = '<tr><td colspan="2" class="text-secondary text-center">No recent inventories</td></tr>';
            }
        }

        // --- Card 4: My Reported Issues ---
        const reportsBody = document.getElementById('staff-reports-body');
        if (reportsBody) {
            reportsBody.innerHTML = '';
            if (data.myReports && data.myReports.length > 0) {
                data.myReports.forEach(report => {
                    const tr = document.createElement('tr');
                    const invName = report.inventory ? report.inventory.inventory_name : 'Unknown';
                    tr.innerHTML = `
                        <td class="font-medium text-dark">${invName}</td>
                        <td class="text-secondary text-sm">${report.remarks}</td>
                    `;
                    reportsBody.appendChild(tr);
                });
            } else {
                reportsBody.innerHTML = '<tr><td colspan="2" class="text-secondary text-center">No reports submitted</td></tr>';
            }
        }
    }

    function renderUserDashboard(data) {
        const grid = document.getElementById('user-inventory-grid');
        if (grid) {
            grid.innerHTML = '';
            if (data.availableInventories && data.availableInventories.length > 0) {
                data.availableInventories.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'content-card p-3 flex flex-col justify-between';
                    card.style.minHeight = '140px';
                    
                    const imgUrl = item.inventory_photo ? CONFIG.apiUrl(item.inventory_photo) : 'images/default-item.png';
                    const roomName = item.room ? item.room.room_name : 'No Room';

                    card.innerHTML = `
                        <div class="mb-2">
                            <h4 class="font-medium text-dark text-sm truncate" title="${item.inventory_name}">${item.inventory_name}</h4>
                            <p class="text-xs text-secondary truncate">${roomName}</p>
                        </div>
                        <div class="flex items-center justify-between mt-auto">
                            <span class="text-xs font-bold ${getStatusColor(item.status_condition)}">${item.status_condition}</span>
                            <button class="btn-icon-sm text-red-500 hover:bg-red-50" onclick="openReportModal(${item.id}, '${item.inventory_name}')" title="Report Issue">
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                </svg>
                            </button>
                        </div>
                    `;
                    grid.appendChild(card);
                });
            } else {
                grid.innerHTML = '<p class="text-secondary text-center col-span-full py-4">No inventories available.</p>';
            }
        }
    }

    function getStatusColor(status) {
        if (!status) return 'text-secondary';
        const s = status.toUpperCase();
        if (s.includes('GOOD')) return 'text-green-600';
        if (s.includes('ATTENTION') || s.includes('REPAIR')) return 'text-yellow-600';
        return 'text-red-600';
    }

    // Helper for Report Modal (Should already exist or need link)
    window.openReportModal = function(invId, invName) {
        // Redirect to reports page with pre-fill params? 
        // Or simpler: just go to reports page. 
        // User requested "Report Icons", assuming they link to report functionality.
        // For now, let's redirect to reports.html with query params
        window.location.href = `reports.html?action=report&inventory_id=${invId}&inventory_name=${encodeURIComponent(invName)}`;
    };

    function renderChart(data, goodCount, attentionCount, ngCount, total) {
        // Safety for div
        const safeTotal = total > 0 ? total : 1;

        const p1 = (goodCount / safeTotal) * 100;
        const p2 = p1 + ((attentionCount / safeTotal) * 100);

        // Update Total Label
        const totalLabel = document.getElementById('chart-total-label');
        if (totalLabel) totalLabel.textContent = total;

        // Update Circle Gradient
        const chartCircle = document.getElementById('chart-circle');
        if (chartCircle) {
            chartCircle.style.background = `conic-gradient(#10B981 0% ${p1}%, #F59E0B ${p1}% ${p2}%, #EF4444 ${p2}% 100%)`;
        }

        // Update Legend
        const legend = document.getElementById('chart-legend');
        if (legend) {
            legend.innerHTML = `
                <div class="legend-item">
                    <div style="display:flex; align-items:center;">
                        <span class="legend-color bg-green-100" style="background:#10B981"></span>
                        <span class="text-dark">Good</span>
                    </div>
                    <span class="font-medium text-dark">${Math.round(p1)}%</span>
                </div>
                <div class="legend-item">
                    <div style="display:flex; align-items:center;">
                        <span class="legend-color bg-yellow-100" style="background:#F59E0B"></span>
                        <span class="text-dark">Attention</span>
                    </div>
                    <span class="font-medium text-dark">${Math.round((attentionCount / safeTotal) * 100)}%</span>
                </div>
                <div class="legend-item">
                    <div style="display:flex; align-items:center;">
                        <span class="legend-color bg-red-100" style="background:#EF4444"></span>
                        <span class="text-dark">Not Good / Broken</span>
                    </div>
                    <span class="font-medium text-dark">${Math.round((ngCount / safeTotal) * 100)}%</span>
                </div>
            `;
        }
    }

});
