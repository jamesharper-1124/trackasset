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
            sidebar.classList.toggle('show');
            sidebarOverlay.classList.toggle('show');
        });
    }

    // Close Sidebar on Overlay Click
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function () {
            sidebar.classList.remove('show');
            sidebarOverlay.classList.remove('show');
        });
    }

    // Dropdown Toggle
    if (dropdownBtn && dropdownMenu) {
        dropdownBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.style.display = 'none';
            }
        });
    }

    // --------------------------------------------------------------------------
    // Dashboard Data Fetching (AJAX)
    // --------------------------------------------------------------------------
    const dashboardDataUrl = '/api/dashboard/data'; // Adjust if route usage differs

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
        // 1. New Inventories
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
                inventoryBody.innerHTML = '<tr><td colspan="2" class="text-secondary text-center">No recent inventories</td></tr>';
            }
        }

        // 2. New Users
        const usersList = document.getElementById('new-users-list');
        if (usersList) {
            usersList.innerHTML = '';
            if (data.newUsers && data.newUsers.length > 0) {
                data.newUsers.forEach(user => {
                    const li = document.createElement('li');
                    li.className = 'user-item';
                    li.innerHTML = `
                        <span class="font-medium text-dark">${user.firstname} ${user.lastname}</span>
                        <span class="user-role">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
                    `;
                    usersList.appendChild(li);
                });
            } else {
                usersList.innerHTML = '<li class="text-secondary text-center">No recent users</li>';
            }
        }

        // 3. Problem Inventories
        const problemsBody = document.getElementById('problem-inventories-body');
        if (problemsBody) {
            problemsBody.innerHTML = '';
            if (data.problemInventories && data.problemInventories.length > 0) {
                data.problemInventories.forEach(report => {
                    const tr = document.createElement('tr');
                    const invName = report.inventory ? report.inventory.inventory_name : 'Previously Deleted';
                    tr.innerHTML = `
                        <td class="font-medium text-dark">${invName}</td>
                        <td class="text-red font-medium">${report.remarks}</td>
                     `;
                    problemsBody.appendChild(tr);
                });
            } else {
                problemsBody.innerHTML = '<tr><td colspan="2" class="text-secondary text-center">No issues reported</td></tr>';
            }
        }

        // 4. Chart Statistics
        renderChart(data);
    }

    function renderChart(data) {
        const stats = data.stats || {};
        const total = data.totalInventories > 0 ? data.totalInventories : 1;

        // Count aggregation matching PHP logic
        const goodCount = (stats['GOOD'] || 0) + (stats['Good Condition'] || 0);
        const attentionCount = (stats['NEEDS ATTENTION'] || 0) + (stats['Needs Attention Condition'] || 0) + (stats['Needs Repair'] || 0);
        const ngCount = (stats['N.G'] || 0) + (stats['N.G. Condition'] || 0) + (stats['Broken'] || 0);

        const goodPercent = (goodCount / total) * 100;
        const attentionPercent = (attentionCount / total) * 100;
        const ngPercent = (ngCount / total) * 100;

        const p1 = goodPercent;
        const p2 = goodPercent + attentionPercent;

        // Update Total Label
        const totalLabel = document.getElementById('chart-total-label');
        if (totalLabel) totalLabel.textContent = data.totalInventories;

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
                        <span class="legend-color bg-green"></span>
                        <span class="text-dark">Good Condition</span>
                    </div>
                    <span class="font-medium text-dark">${Math.round(goodPercent)}%</span>
                </div>
                <div class="legend-item">
                    <div style="display:flex; align-items:center;">
                        <span class="legend-color bg-yellow"></span>
                        <span class="text-dark">Needs Attention Condition</span>
                    </div>
                    <span class="font-medium text-dark">${Math.round(attentionPercent)}%</span>
                </div>
                <div class="legend-item">
                    <div style="display:flex; align-items:center;">
                        <span class="legend-color bg-red"></span>
                        <span class="text-dark">N.G. Condition</span>
                    </div>
                    <span class="font-medium text-dark">${Math.round(ngPercent)}%</span>
                </div>
            `;
        }
    }

});
