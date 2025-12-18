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
    if (document.getElementById('chart-circle')) {
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
        console.log('Dashboard Data Received:', data); // DEBUG
        console.log('In Use Count:', data.inUseInventories ? data.inUseInventories.length : 'Undefined'); // DEBUG

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

        // 4. In Use Inventories (New)
        const inUseItems = data.inUseInventories || [];
        const adminInUseBody = document.getElementById('admin-in-use-body');
        const staffInUseBody = document.getElementById('staff-in-use-body');
        const userInUseBody = document.getElementById('user-in-use-body');

        // Find which one exists (only one view is active usually, but even if all are in DOM hidden, we should populate active ones)
        // Since we don't know which is active easily without checking display, 
        // and IDs are unique, we can attempt to populate ALL found IDs.
        [adminInUseBody, staffInUseBody, userInUseBody].forEach(body => {
            if (body) {
                body.innerHTML = '';
                if (inUseItems.length > 0) {
                    inUseItems.forEach(item => {
                        const tr = document.createElement('tr');
                        // Helper for status color
                        let statusColor = 'text-secondary';
                        if (item.status_condition === 'GOOD') statusColor = 'text-green-600';
                        else if (item.status_condition === 'NEEDS ATTENTION') statusColor = 'text-yellow-600';
                        else if (item.status_condition === 'N.G') statusColor = 'text-red-600';

                        tr.innerHTML = `
                            <td class="font-medium text-dark">${item.inventory_name}</td>
                            <td class="text-center">${item.quantity}</td>
                            <td class="${statusColor}" style="text-transform: capitalize;">${item.status_condition.toLowerCase()}</td>
                        `;
                        body.appendChild(tr);
                    });
                } else {
                    body.innerHTML = '<tr><td colspan="3" class="text-secondary text-center" style="padding:1rem;">No items currently in use</td></tr>';
                }
            }
        });

        // 5. Chart Statistics
        renderChart(data, goodCount, attentionCount, ngCount, total);
    }

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
