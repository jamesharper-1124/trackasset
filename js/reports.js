document.addEventListener('DOMContentLoaded', function () {
    // Note: auth-guard.js handles global 401 checks on load and via ajax requests.

    const submittedContainer = document.getElementById('submitted-reports-container');
    const receivedContainer = document.getElementById('received-reports-container');
    const submittedSection = document.getElementById('submitted-reports-section');
    const receivedSection = document.getElementById('received-reports-section');
    const submittedCountEl = document.getElementById('submitted-count');
    const receivedCountEl = document.getElementById('received-count');

    // Selection Mode State
    let selectedReportIds = new Set();
    const btnDeleteText = document.getElementById('btn-delete-text');

    // --------------------------------------------------------------------------
    // Sidebar & Dropdown Logic (Redundant Safety)
    // --------------------------------------------------------------------------
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const dropdownBtn = document.getElementById('dropdown-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            console.log('Reports: Sidebar Toggle Clicked');
            sidebar.classList.toggle('show');
            sidebarOverlay.classList.toggle('show');
        });
    }
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function () {
            sidebar.classList.remove('show');
            sidebarOverlay.classList.remove('show');
        });
    }
    if (dropdownBtn) {
        dropdownBtn.addEventListener('click', function (e) {
            console.log('Reports: Dropdown Clicked');
            e.stopPropagation();
            if (dropdownMenu) dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
        });
        document.addEventListener('click', function (e) {
            if (dropdownMenu && !dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.style.display = 'none';
            }
        });
    }

    // --------------------------------------------------------------------------
    // Accordion Logic (Attach Listeners)
    // --------------------------------------------------------------------------
    const submittedToggle = document.getElementById('submitted-toggle');
    const receivedToggle = document.getElementById('received-toggle');

    if (submittedToggle) {
        submittedToggle.addEventListener('click', function () {
            window.toggleSection('submitted-reports-container', this);
        });
    }
    if (receivedToggle) {
        receivedToggle.addEventListener('click', function () {
            window.toggleSection('received-reports-container', this);
        });
    }

    // Initial Fetch
    fetchReportsData();

    function fetchReportsData() {
        $.ajax({
            url: CONFIG.apiUrl('/api/reports/data'),
            method: 'GET',
            success: function (data) {
                renderReports(data);
            },
            error: function (xhr) {
                // 401 handled globally by auth-guard
                if (xhr.status !== 401) {
                    console.error('Error loading reports:', xhr);
                }
            }
        });
    }

    function renderReports(data) {
        const { submittedReports, receivedReports, currentUser } = data;

        // Submitted Reports
        const submittedContainer = document.getElementById('submitted-reports-container');
        const submittedEmpty = document.getElementById('submitted-empty-state');
        const submittedCountEl = document.getElementById('submitted-count');

        submittedCountEl.textContent = submittedReports ? submittedReports.length : 0;

        // Remove old content but keep empty state element
        Array.from(submittedContainer.children).forEach(child => {
            if (child.id !== 'submitted-empty-state') submittedContainer.removeChild(child);
        });

        if (submittedReports && submittedReports.length > 0) {
            submittedEmpty.style.display = 'none';
            submittedReports.forEach(report => {
                submittedContainer.appendChild(createReportCard(report, currentUser, true));
            });
        } else {
            submittedEmpty.style.display = 'block';
        }

        // Received Reports
        const receivedContainer = document.getElementById('received-reports-container');
        const receivedEmpty = document.getElementById('received-empty-state');
        const receivedCountEl = document.getElementById('received-count');

        receivedCountEl.textContent = receivedReports ? receivedReports.length : 0;
        // Remove old content but keep empty state element
        Array.from(receivedContainer.children).forEach(child => {
            if (child.id !== 'received-empty-state') receivedContainer.removeChild(child);
        });

        if (receivedReports && receivedReports.length > 0) {
            receivedEmpty.style.display = 'none';
            receivedReports.forEach(report => {
                receivedContainer.appendChild(createReportCard(report, currentUser, false));
            });
        } else {
            receivedEmpty.style.display = 'block';
        }
    }

    function createReportCard(report, currentUser, isSubmitted) {
        const card = document.createElement('div');
        card.className = 'h-card'; // Use horizontal card style
        card.dataset.id = report.id;

        // Store Full Object for Modal functionality
        card.reportData = report;

        const photoUrl = report.evidence_photo ? `/${report.evidence_photo}` : null;
        const inventoryName = report.inventory ? report.inventory.inventory_name : 'Deleted Inventory';
        const roomName = (report.inventory && report.inventory.room) ? report.inventory.room.room_name : 'Unknown Room';
        const dateStr = new Date(report.date_reported).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        // Image Section
        let imageHtml = '';
        if (photoUrl) {
            const fullPhotoUrl = photoUrl.startsWith('http') ? photoUrl : CONFIG.apiUrl(photoUrl);
            imageHtml = `<img src="${fullPhotoUrl}" alt="Details">`;
        } else {
            imageHtml = `<span style="font-size:0.7rem; color:#9ca3af;">No Img</span>`;
        }

        // Status Badge Logic
        let statusClass = 'status-good';
        let statusText = report.status_condition || 'Unknown';
        if (statusText === 'NEEDS ATTENTION') statusClass = 'status-fair';
        if (statusText === 'N.G') statusClass = 'status-danger';

        // Checkbox HTML
        const checkboxHtml = `
            <div class="card-checkbox-wrapper" onclick="event.stopPropagation()">
                <input type="checkbox" class="report-checkbox" value="${report.id}">
            </div>
        `;

        card.innerHTML = `
            <div class="h-card-img-wrapper" onclick="openReportModal('${report.id}')">
                ${imageHtml}
            </div>
            
            <div class="h-card-content" onclick="openReportModal('${report.id}')">
                <div class="h-card-info">
                    <h4 class="h-card-title">${inventoryName}</h4>
                    <div class="h-card-meta">
                        <span class="meta-item">
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                            ${roomName}
                        </span>
                        <span class="meta-item">
                           <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                           ${dateStr}
                        </span>
                    </div>
                </div>

                <div class="h-card-actions">
                     <span class="card-status ${statusClass}">${statusText}</span>
                     ${checkboxHtml}
                </div>
            </div>
        `;

        return card;
    }

    // --------------------------------------------------------------------------
    // Bulk Selection Logic
    // --------------------------------------------------------------------------
    const btnDeleteSelected = document.getElementById('btn-delete-selected');
    const selectedCountSpan = document.getElementById('selected-count');

    // Select All Checkboxes
    const selectAllSubmitted = document.getElementById('select-all-submitted');

    if (selectAllSubmitted) {
        selectAllSubmitted.addEventListener('change', function () {
            const isChecked = this.checked;
            // Only select visible checkboxes in submitted table
            const checkboxes = document.querySelectorAll('#submitted-reports-container .report-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = isChecked;
                const id = parseInt(cb.value);
                if (isChecked) selectedReportIds.add(id);
                else selectedReportIds.delete(id);
            });
            updateDeleteButton();
        });
    }

    // 1. Update Button Visibility
    function updateDeleteButton() {
        selectedCountSpan.textContent = selectedReportIds.size;

        if (selectedReportIds.size > 0) {
            btnDeleteSelected.style.display = 'inline-flex';
        } else {
            btnDeleteSelected.style.display = 'none';
        }
    }

    // 2. Trigger Delete
    btnDeleteSelected.addEventListener('click', function () {
        if (confirm(`Delete ${selectedReportIds.size} selected reports?`)) {
            performBulkDelete();
        }
    });

    // Delegated Checkbox Click
    $(document).on('change', '.report-checkbox', function (e) {
        const id = parseInt(this.value);
        if (this.checked) selectedReportIds.add(id);
        else selectedReportIds.delete(id);

        updateDeleteButton();
    });

    // Prevent modal opening when clicking checkbox wrapper
    $(document).on('click', '.card-checkbox-wrapper', function (e) {
        e.stopPropagation();
    });

    function performBulkDelete() {
        // Redundant token check removed - rely on auth-guard or backend 401
        const idsArray = Array.from(selectedReportIds);
        $.ajax({
            url: CONFIG.apiUrl('/api/reports/bulk-delete'),
            method: 'DELETE',
            data: { ids: idsArray },
            success: function (res) {
                alert('Report has been deleted.');
                fetchReportsData();
                exitSelectionMode();
            },
            error: function (xhr) {
                // 401 handled globally
                if (xhr.status !== 401) {
                    alert('Bulk delete failed: ' + (xhr.responseJSON?.message || 'Unknown error'));
                }
            }
        });
    }

    function exitSelectionMode() {
        // Clear selection
        selectedReportIds.clear();
        updateDeleteButton();
        document.querySelectorAll('.report-checkbox').forEach(cb => cb.checked = false);
    }

    // --------------------------------------------------------------------------
    // Modal Logic
    // --------------------------------------------------------------------------
    const modal = document.getElementById('report-modal');
    const modalView = document.getElementById('modal-view-mode');
    const modalEdit = document.getElementById('modal-edit-form');

    // Elements
    const mInventory = document.getElementById('modal-inventory-name');
    const mRemarks = document.getElementById('modal-remarks');
    const mStatus = document.getElementById('modal-status');
    const mDate = document.getElementById('modal-date');
    const mImg = document.getElementById('modal-img');
    const mActions = document.getElementById('modal-actions-submitted');

    // Edit Form Elements
    const eInventory = document.getElementById('edit-inventory-name');
    const eRemarks = document.getElementById('edit-remarks');
    let currentReportId = null;

    const btnDelete = document.getElementById('btn-delete-report');
    if (btnDelete) {
        btnDelete.addEventListener('click', function () {
            window.confirmDelete();
        });
    }

    window.openReportModal = function (reportId) {
        // Find report data
        const card = document.querySelector(`.h-card[data-id="${reportId}"]`);
        if (!card || !card.reportData) return;
        const r = card.reportData;
        currentReportId = r.id;

        // Populate View
        mInventory.textContent = r.inventory ? r.inventory.inventory_name : 'Deleted';
        mRemarks.textContent = r.remarks;
        mStatus.textContent = r.status_condition;
        mDate.textContent = new Date(r.date_reported).toLocaleDateString();

        if (r.evidence_photo) {
            let src = r.evidence_photo;
            console.log('DEBUG: Original photo path:', src); // Debug log
            if (!src.startsWith('http')) {
                const path = src.startsWith('/') ? src : `/${src}`;
                src = CONFIG.apiUrl(path);
            }
            console.log('DEBUG: Final modal image src:', src); // Debug log
            mImg.src = src;
            mImg.style.display = 'block';
        } else {
            mImg.style.display = 'none';
        }

        // Show Actions (Delete) for EVERYONE
        // Backend handles logic: Owner -> Hard Delete, Receiver -> Soft Delete (Hide)
        mActions.style.display = 'flex';

        modal.classList.add('show');
        modalView.style.display = 'block';
        modalEdit.style.display = 'none';
    };

    window.closeReportModal = function () {
        modal.classList.remove('show');
    };

    // Close on overlay click
    modal.addEventListener('click', function (e) {
        if (e.target === modal) closeReportModal();
    });
    document.getElementById('modal-close-btn').addEventListener('click', closeReportModal);

    // Delete Single
    window.confirmDelete = function () {
        if (!confirm('Delete this report?')) return;

        $.ajax({
            url: CONFIG.apiUrl(`/api/reports/${currentReportId}`),
            method: 'DELETE',
            success: function (res) {
                alert('Report has been deleted.');
                closeReportModal();
                fetchReportsData();
            },
            error: function (xhr) {
                // 401 handled globally
                if (xhr.status !== 401) {
                    alert('Delete failed: ' + (xhr.responseJSON?.message || 'Unknown error'));
                }
            }
        });
    };

    // Store currentUser globally for logic
    const originalRender = renderReports;
    renderReports = function (data) {
        window.currentUser = data.currentUser;
        originalRender(data);
    };

    // Accordion Toggle Logic (Global for inline onclick)
    window.toggleSection = function (containerId, headerEl) {
        const container = document.getElementById(containerId);
        const icon = headerEl.querySelector('.chevron-icon');

        if (container.style.display === 'none') {
            container.style.display = 'grid';
            if (icon) icon.style.transform = 'rotate(0deg)';
        } else {
            container.style.display = 'none';
            if (icon) icon.style.transform = 'rotate(-90deg)';
        }
    };

});
